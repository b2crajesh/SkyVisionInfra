import { useState } from "react";
import { useToast } from "./ToastProvider";
import Button from "./ui/Button";
import { api } from "../lib/api";

interface DownloadIdCardButtonProps {
  endpoint: string;
  filename: string;
  className?: string;
}

export default function DownloadIdCardButton({
  endpoint,
  filename,
  className = "",
}: DownloadIdCardButtonProps) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data } = await api.get<Blob>(endpoint, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast("Unable to download the associate ID card. Please try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      disabled={downloading}
      onClick={handleDownload}
    >
      {downloading ? "Preparing PDF..." : "Download ID card"}
    </Button>
  );
}
