import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorAlertProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export default function ErrorAlert({ 
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  retryText = "Try again",
  className 
}: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className={className} data-testid="error-alert">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {message}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-3 h-8"
            data-testid="button-retry"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            {retryText}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}