import { useEffect, useState } from "react";
import axios from "axios";
import { api } from "../lib/api";

interface MemberProfilePhotoProps {
  endpoint: string;
  hasPhoto?: boolean;
  initials: string;
  onUploaded: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function MemberProfilePhoto({
  endpoint,
  hasPhoto = false,
  initials,
  onUploaded,
}: MemberProfilePhotoProps) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setPhotoUrl("");
    setImageFailed(false);
    setError("");

    if (hasPhoto) {
      api
        .get<{ url: string }>(`${endpoint}/photo`)
        .then(({ data }) => {
          if (active) setPhotoUrl(data.url);
        })
        .catch(() => {
          if (active) setError("Could not load the current photo.");
        });
    }

    return () => {
      active = false;
    };
  }, [endpoint, hasPhoto]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setError("");
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Photo must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const { data } = await api.post<{ url: string }>(`${endpoint}/photo`, file, {
        headers: { "Content-Type": file.type },
      });
      setPhotoUrl(data.url);
      setImageFailed(false);
      onUploaded();
    } catch (uploadError) {
      const message = axios.isAxiosError<{ message?: string }>(uploadError)
        ? uploadError.response?.data?.message
        : undefined;
      setError(message ?? "Photo upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white/40 bg-white/10 text-lg font-bold tracking-wide text-white shadow-soft">
        {photoUrl && !imageFailed ? (
          <img
            src={photoUrl}
            alt="Associate profile"
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          initials
        )}
      </div>
      <label className="cursor-pointer text-xs font-medium text-white/85 underline underline-offset-2 hover:text-white">
        {uploading ? "Uploading..." : hasPhoto ? "Change photo" : "Add photo"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={uploading}
          onChange={handleFileChange}
        />
      </label>
      {error && (
        <p role="alert" className="max-w-40 text-center text-xs text-rose-100">
          {error}
        </p>
      )}
    </div>
  );
}
