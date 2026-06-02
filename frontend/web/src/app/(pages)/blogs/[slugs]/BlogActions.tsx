"use client";

import { useEffect, useMemo, useState } from "react";
import { FaThumbsUp } from "react-icons/fa";
import { FiShare2, FiThumbsUp } from "react-icons/fi";

type BlogActionsProps = {
  blogId?: string;
  title: string;
  initialLikes?: number;
  initialShares?: number;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function BlogActions({
  blogId,
  title,
  initialLikes = 0,
  initialShares = 0,
}: BlogActionsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [shares, setShares] = useState(initialShares);
  const [liked, setLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const likeStorageKey = useMemo(
    () => (blogId ? `propenu:blog-liked:${blogId}` : ""),
    [blogId],
  );

  useEffect(() => {
    if (!likeStorageKey) return;
    const hasLiked = window.localStorage.getItem(likeStorageKey) === "true";
    setLiked(hasLiked);

    if (hasLiked) {
      setLikes((value) => Math.max(value, 1));
    }
  }, [likeStorageKey]);

  async function incrementCounter(type: "like" | "share") {
    if (!blogId || !apiUrl) return null;

    const response = await fetch(
      `${apiUrl}/api/properties/blogs/${blogId}/${type}`,
      {
        method: "POST",
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to ${type} blog`);
    }

    const json = await response.json();
    return json.data as { likes?: number; shares?: number };
  }

  async function handleLike() {
    if (liked || isLiking) return;

    setIsLiking(true);
    setLiked(true);
    setLikes((value) => value + 1);

    try {
      const data = await incrementCounter("like");
      if (typeof data?.likes === "number") setLikes(data.likes);
      if (likeStorageKey) window.localStorage.setItem(likeStorageKey, "true");
    } catch {
      setLiked(false);
      setLikes((value) => Math.max(value - 1, 0));
    } finally {
      setIsLiking(false);
    }
  }

  async function handleShare() {
    if (isSharing) return;

    setIsSharing(true);

    try {
      const shareUrl = window.location.href;
      const shareData = { title, url: shareUrl };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }

      setShares((value) => value + 1);
      const data = await incrementCounter("share");
      if (typeof data?.shares === "number") setShares(data.shares);
    } catch {
      // Sharing can be cancelled by the user; keep the page quiet.
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div className="flex items-center gap-3 text-gray-500">
      <button
        type="button"
        aria-label={liked ? "Article liked" : "Like article"}
        aria-pressed={liked}
        disabled={liked || isLiking}
        onClick={handleLike}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-full px-3 text-xs transition hover:bg-green-50 hover:text-[#26ad5f] disabled:cursor-default disabled:text-[#26ad5f]"
      >
        {liked ? <FaThumbsUp size={17} /> : <FiThumbsUp size={18} />}
        <span>{liked ? Math.max(likes, 1) : likes}</span>
      </button>

      <button
        type="button"
        aria-label="Share article"
        disabled={isSharing}
        onClick={handleShare}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-full px-3 text-xs transition hover:bg-green-50 hover:text-[#26ad5f] disabled:opacity-70"
      >
        <FiShare2 size={18} />
        <span>{shares}</span>
      </button>
    </div>
  );
}
