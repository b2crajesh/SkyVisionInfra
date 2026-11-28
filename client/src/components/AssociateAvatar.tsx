import { useEffect, useState } from "react";
import axios from "axios";
import { api } from "../lib/api";

interface AssociateAvatarProps {
  memberId: string;
  name: string;
  hasPhoto?: boolean;
  className: string;
}

export default function AssociateAvatar({
  memberId,
  name,
  hasPhoto,
  className,
}: AssociateAvatarProps) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoUnavailable, setPhotoUnavailable] = useState(false);
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "A";

  useEffect(() => {
    let active = true;
    setPhotoUrl("");
    setPhotoUnavailable(false);

    if (hasPhoto === false) return () => {
      active = false;
    };

    api
      .get<{ url: string }>("/members/me/photo")
      .then(({ data }) => {
        if (active) setPhotoUrl(data.url);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (axios.isAxiosError(error) && error.response?.status === 404) return;
        setPhotoUnavailable(true);
      });

    return () => {
      active = false;
    };
  }, [memberId, hasPhoto]);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden font-semibold text-white ${className}`}
      title={photoUnavailable ? "Profile photo could not be loaded" : `${name} profile photo`}
      aria-label={`${name} profile`}
    >
      {photoUrl && !photoUnavailable ? (
        <img
          src={photoUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setPhotoUnavailable(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}
