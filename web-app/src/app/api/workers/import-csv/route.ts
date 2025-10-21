// API Route: CSV Import Job Worker
// POST /api/workers/import-csv
// Processes CSV import jobs in the background

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseCSVFromURL, validateBatch, batchArray } from '@/lib/csv-parser'
import { bulkCreateAccounts } from '@/services/accounts'
import { bulkCreateContacts } from '@/services/contacts'
import type { ImportJobPayload, ImportProgress, EntityType } from '@/types/import'

const BATCH_SIZE = 100

/**
 * Process CSV import job
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get job ID from query params
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    if (!jobId) {
      return NextResponse.json({ error: 'job_id is required' }, { status: 400 })
    }

    // Fetch job from database
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Update job status to processing
    await supabase
      .from('jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    const payload = job.payload as ImportJobPayload
    const { fileUrl, entityType, mapping, options, metadata } = payload

    try {
      // Parse CSV from URL
      const csvData = await parseCSVFromURL(fileUrl)

      // Initialize progress
      const totalRows = csvData.rows.length
      let processedRows = 0
      let successfulRows = 0
      let failedRows = 0
      const allErrors: any[] = []

      // Split into batches
      const batches = batchArray(csvData.rows, BATCH_SIZE)

      // Process each batch
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        const startIndex = batchIndex * BATCH_SIZE

        // Validate batch
        const validatedRows = validateBatch(
          batch,
          startIndex,
          mapping,
          entityType
        )

        // Separate valid and invalid rows
        const validRows = validatedRows.filter((row) => row.isValid)
        const invalidRows = validatedRows.filter((row) => !row.isValid)

        // Collect errors from invalid rows
        invalidRows.forEach((row) => {
          allErrors.push(...row.errors)
        })

        // Prepare data for import
        const dataToImport = validRows.map((row) => ({
          ...row.data,
          workspace_id: job.workspace_id,
        }))

        // Import batch based on entity type
        if (dataToImport.length > 0) {
          try {
            if (entityType === 'accounts') {
              await bulkCreateAccounts(dataToImport)
            } else if (entityType === 'contacts') {
              await bulkCreateContacts(dataToImport)
            }
            successfulRows += validRows.length
          } catch (importError: any) {
            console.error('Import batch error:', importError)
            failedRows += validRows.length
            allErrors.push({
              row: startIndex + 1,
              column: 'batch',
              value: null,
              error: `Batch import failed: ${importError.message}`,
            })
          }
        }

        failedRows += invalidRows.length
        processedRows += batch.length

        // Update progress
        const progress: ImportProgress = {
          total: totalRows,
          processed: processedRows,
          successful: successfulRows,
          failed: failedRows,
          percentage: Math.round((processedRows / totalRows) * 100),
          currentBatch: batchIndex + 1,
          message: `Processing batch ${batchIndex + 1}/${batches.length} (${processedRows}/${totalRows} rows)`,
          errors: allErrors.slice(0, 100), // Limit to first 100 errors
        }

        await supabase
          .from('jobs')
          .update({ progress })
          .eq('id', jobId)
      }

      // Complete job
      await supabase
        .from('jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result: {
            total: totalRows,
            successful: successfulRows,
            failed: failedRows,
            skipped: 0,
            errors: allErrors.slice(0, 100),
          },
        })
        .eq('id', jobId)

      return NextResponse.json({
        success: true,
        result: {
          total: totalRows,
          successful: successfulRows,
          failed: failedRows,
        },
      })
    } catch (processingError: any) {
      console.error('CSV processing error:', processingError)

      // Mark job as failed
      await supabase
        .from('jobs')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          error_message: processingError.message,
          error_stack: processingError.stack,
        })
        .eq('id', jobId)

      return NextResponse.json(
        { error: processingError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Worker error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
