"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStoredToken } from "@/lib/api/owners";
import { listPosts, type ClassifiedPost } from "@/lib/api/classifieds";

const PREVIEW_LIMIT = 5;

export default function ClassifiedsPreview({
  className,
}: {
  className?: string;
}) {
  const [posts, setPosts] = useState<ClassifiedPost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setPosts([]);
      return;
    }
    setLoading(true);
    listPosts()
      .then((list) => setPosts(list.slice(0, PREVIEW_LIMIT)))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card
      className={cn(
        "border-white/40 bg-white/70 shadow-lg backdrop-blur-xl",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-slate-700" />
            <CardTitle className="text-base font-semibold text-slate-900">
              Classifieds
            </CardTitle>
          </div>
          <Link href="/classifieds">
            <Button variant="ghost" size="sm" className="h-8">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : posts.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            No active classifieds
          </p>
        ) : (
          <ul className="space-y-2">
            {posts.map((post) => (
              <li key={post._id}>
                <Link
                  href="/classifieds"
                  className="block rounded-md px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <span className="font-medium">{post.title}</span>
                  {post.category?.name && (
                    <span className="ml-2 text-slate-500">
                      · {post.category.name}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
