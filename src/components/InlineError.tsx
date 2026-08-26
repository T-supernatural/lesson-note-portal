import { AlertCircle } from "lucide-react";
import Button from "./Button";

type InlineErrorProps = {
  message: string;
  onRetry?: () => void;
};

const InlineError = ({ message, onRetry }: InlineErrorProps) => (
  <div
    className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 sm:flex-row sm:items-center sm:justify-between"
    role="alert"
  >
    <div className="flex items-start gap-2">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
    {onRetry ? (
      <Button
        type="button"
        variant="outline"
        className="self-start border-rose-200 px-3 py-2 text-rose-900 hover:bg-rose-100 sm:self-auto"
        onClick={onRetry}
      >
        Try again
      </Button>
    ) : null}
  </div>
);

export default InlineError;
