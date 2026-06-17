"use client";

type AgentSubmissionSuccessDialogProps = {
  open: boolean;
  onPostAnother: () => void;
  onViewProperties: () => void;
};

export default function AgentSubmissionSuccessDialog({
  open,
  onPostAnother,
  onViewProperties,
}: AgentSubmissionSuccessDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <span className="text-3xl font-semibold text-green-600">✓</span>
        </div>

        <h2 className="text-xl font-semibold text-gray-900">
          Congratulations!
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Your property has been submitted successfully and is now pending
          review.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onPostAnother}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Post Another
          </button>
          <button
            type="button"
            onClick={onViewProperties}
            className="btn-primary rounded-md px-4 py-2 text-sm font-medium text-white"
          >
            My Properties
          </button>
        </div>
      </div>
    </div>
  );
}
