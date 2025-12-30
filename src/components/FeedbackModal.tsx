import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Rating = "good" | "neutral" | "bad" | null;

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState<Rating>(null);
  const [feedback, setFeedback] = useState("");

  const getRatingLabel = (r: Rating) => {
    if (r === "good") return t("feedback.reallyGood", "Really Good");
    if (r === "neutral") return t("feedback.okay", "Okay");
    if (r === "bad") return t("feedback.notGood", "Not Good");
    return "";
  };

  const handleSubmit = () => {
    if (!rating) {
      toast({
        title: t("feedback.selectRating", "Please select a rating"),
        variant: "destructive",
      });
      return;
    }

    // For now, just show a success toast
    toast({
      title: t("feedback.thankYou", "Thank you for your feedback!"),
      description: t("feedback.submitted", "Your review has been submitted successfully."),
    });

    // Reset and close
    setRating(null);
    setFeedback("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setRating(null);
    setFeedback("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-lg font-medium text-foreground">
            {t("feedback.shareReview", "Share Review")}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Title and subtitle */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              {t("feedback.howWasExperience", "How was your experience?")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(
                "feedback.reviewHelps",
                "Your review will help us improve our product and make it user friendly for more users.",
              )}
            </p>
          </div>

          {/* Emoji rating selection */}
          <div className="flex items-start justify-center gap-4">
            {/* Good - Happy face */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => setRating("good")}
                className={`relative w-16 h-16 rounded-full transition-all duration-200 flex items-center justify-center ${
                  rating === "good" ? "ring-4 ring-[#19976F] ring-offset-2" : "hover:scale-110"
                } ${rating !== "good" && rating !== null ? "grayscale" : ""}`}
              >
                <span className="text-4xl">😊</span>
              </button>
              {rating === "good" && (
                <div className="relative">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-[#19976F]" />
                  <span className="bg-[#19976F] text-white text-sm font-medium px-4 py-1.5 rounded-full whitespace-nowrap">
                    {t("feedback.reallyGood", "Really Good")}
                  </span>
                </div>
              )}
            </div>

            {/* Neutral - Neutral face */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => setRating("neutral")}
                className={`relative w-16 h-16 rounded-full transition-all duration-200 flex items-center justify-center ${
                  rating === "neutral" ? "ring-4 ring-[#19976F] ring-offset-2" : "hover:scale-110"
                } ${rating !== "neutral" && rating !== null ? "grayscale" : ""}`}
              >
                <span className="text-4xl">😐</span>
              </button>
              {rating === "neutral" && (
                <div className="relative">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-[#19976F]" />
                  <span className="bg-[#19976F] text-white text-sm font-medium px-4 py-1.5 rounded-full whitespace-nowrap">
                    {t("feedback.okay", "Okay")}
                  </span>
                </div>
              )}
            </div>

            {/* Bad - Sad face */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => setRating("bad")}
                className={`relative w-16 h-16 rounded-full transition-all duration-200 flex items-center justify-center ${
                  rating === "bad" ? "ring-4 ring-[#19976F] ring-offset-2" : "hover:scale-110"
                } ${rating !== "bad" && rating !== null ? "grayscale" : ""}`}
              >
                <span className="text-4xl">😔</span>
              </button>
              {rating === "bad" && (
                <div className="relative">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-[#19976F]" />
                  <span className="bg-[#19976F] text-white text-sm font-medium px-4 py-1.5 rounded-full whitespace-nowrap">
                    {t("feedback.notGood", "Not Good")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Feedback textarea */}
          <Textarea
            placeholder={t("feedback.shareFeedback", "Share feedback...")}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px] resize-none border-border focus-visible:ring-[#1b966c] focus-visible:border-[#1b966c]"
          />

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            className="w-full h-12 text-base font-medium"
            style={{ backgroundColor: "#19976F" }}
          >
            {t("feedback.submitReview", "Submit Review")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
