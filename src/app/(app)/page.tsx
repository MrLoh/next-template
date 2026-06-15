import { AskQuestionForm } from '../ask-question-form'

export default async function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-10">
      <div className="flex flex-col gap-3 border-t border-border pt-10">
        <div>
          <h2 className="text-lg font-medium">Agent</h2>
          <p className="text-sm text-muted-foreground">
            Ask a question and get an answer from the configured LLM.
          </p>
        </div>
        <AskQuestionForm />
      </div>
    </div>
  )
}
