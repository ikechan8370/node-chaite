export type JobStatus = 'queued' | 'running' | 'done' | 'failed'

export interface BackgroundJob {
  id: string
  description: string
  userId: string
  groupId?: string
  skillName?: string
  conversationId?: string
  /** Associated plan id if the job runs a Plan */
  planId?: string
  status: JobStatus
  /** Final output text, available when status=done */
  result?: string
  error?: string
  createdAt: number
  updatedAt: number
}

/** Payload returned by job:complete / job:failed events */
export interface JobCompletePayload {
  jobId: string
  userId: string
  groupId?: string
  status: 'done' | 'failed'
  result?: string
  error?: string
  planId?: string
}

/** Payload returned by job:progress events (per plan step) */
export interface JobProgressPayload {
  jobId: string
  userId: string
  groupId?: string
  planId?: string
  stepIndex?: number
  stepTotal?: number
  stepTitle?: string
}
