"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getStoredToken,
  clearStoredToken,
  getStoredRole,
  getStoredUserInfo,
  hasAdminAccess,
} from "@/lib/api/owners";
import {
  listCategories,
  listPosts,
  createPost,
  deletePost,
  type ClassifiedCategory,
  type ClassifiedPost,
} from "@/lib/api/classifieds";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, X, User } from "lucide-react";

const POSTS_PER_PAGE = 10;

function formatPostDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function creatorLabel(creator: ClassifiedPost["creator"]): string {
  if (!creator) return "";
  const name = [creator.first, creator.last_name].filter(Boolean).join(" ").trim();
  return name ? `${name} · Unit ${creator.unit_number}` : `Unit ${creator.unit_number}`;
}

export default function ClassifiedsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ClassifiedCategory[]>([]);
  const [posts, setPosts] = useState<ClassifiedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterVisible, setFilterVisible] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    visible_to_other_colonies: false,
    price: "" as string | number,
    contact_info: "",
  });

  const role = getStoredRole();
  const userInfo = getStoredUserInfo();
  const isAdmin = hasAdminAccess(role);

  const loadData = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [cats, list] = await Promise.all([
        listCategories(),
        listPosts({
          category: filterCategory || undefined,
          visible_to_other_colonies:
            filterVisible === "true" ? true : filterVisible === "false" ? false : undefined,
        }),
      ]);
      setCategories(cats);
      setPosts(list);
      setCurrentPage(1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load";
      if (msg.includes("Access denied") || msg.includes("Unauthorized") || msg.includes("expired")) {
        clearStoredToken();
        router.replace("/sign-in");
        return;
      }
      setError(msg);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterVisible, router]);

  useEffect(() => {
    if (!getStoredToken()) {
      router.replace("/sign-in");
      return;
    }
    loadData();
  }, [loadData, router]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.category || !form.description.trim()) {
      setError("Title, category and description are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createPost({
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        visible_to_other_colonies: form.visible_to_other_colonies,
        price: form.price === "" ? undefined : Number(form.price),
        contact_info: form.contact_info.trim() || undefined,
      });
      setForm({
        title: "",
        category: "",
        description: "",
        visible_to_other_colonies: false,
        price: "",
        contact_info: "",
      });
      setOpenCreateModal(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: ClassifiedPost) => {
    if (!window.confirm(`Delete "${post.title}"?`)) return;
    setDeletingId(post._id);
    try {
      await deletePost(post._id);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = (post: ClassifiedPost): boolean => {
    if (isAdmin) return true;
    if (!post.creator?.id || !userInfo?.id) return false;
    return post.creator.id === userInfo.id;
  };

  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = posts.slice(start, start + POSTS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-100 p-4 pt-20 md:pt-24">
      <main className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-emerald-900">Classifieds</h1>
            <p className="mt-1 text-sm text-slate-600">
              Browse and post community classifieds.
            </p>
          </div>
          <Button
            onClick={() => {
              setError(null);
              setForm({
                title: "",
                category: "",
                description: "",
                visible_to_other_colonies: false,
                price: "",
                contact_info: "",
              });
              setOpenCreateModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New classified
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-white/60 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[160px] flex-1 space-y-2">
                <Label className="text-xs text-slate-600">Category</Label>
                <Select
                  value={filterCategory || "all"}
                  onValueChange={(v) => setFilterCategory(v === "all" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[160px] flex-1 space-y-2">
                <Label className="text-xs text-slate-600">Visible to other colonies</Label>
                <Select
                  value={filterVisible || "all"}
                  onValueChange={(v) => setFilterVisible(v === "all" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {paginatedPosts.length === 0 ? (
                <Card className="border-white/60 bg-white/80 backdrop-blur-sm md:col-span-2">
                  <CardContent className="py-12 text-center text-slate-600">
                    No classifieds match your filters. Be the first to post one.
                  </CardContent>
                </Card>
              ) : (
                paginatedPosts.map((post) => (
                  <Card
                    key={post._id}
                    className="border-white/60 bg-white/80 shadow-md backdrop-blur-sm"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            <span className="rounded bg-slate-200 px-2 py-0.5">
                              {post.category?.name ?? "Uncategorized"}
                            </span>
                            {post.visible_to_other_colonies && (
                              <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">
                                Visible to other colonies
                              </span>
                            )}
                            <span>{formatPostDate(post.createdAt)}</span>
                          </div>
                          <CardTitle className="text-lg text-slate-900">
                            {post.title}
                          </CardTitle>

                        </div>
                        {canDelete(post) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(post)}
                            disabled={deletingId === post._id}
                          >
                            {deletingId === post._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span className="ml-1.5">Delete</span>
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {post.description && (
                        <p className="whitespace-pre-wrap text-slate-700">
                          {post.description}
                        </p>
                      )}
                      {post.price != null && (
                        <p className="font-semibold text-slate-800">
                          Price: ${Number(post.price).toLocaleString()}
                        </p>
                      )}
                      
                      {post.creator && (
                        <p className="flex items-center gap-1.5 border-t border-slate-200 pt-3 text-xs text-slate-500">
                          <User className="h-3.5 w-3.5" />
                          Posted by {creatorLabel(post.creator)}
                        </p>
                      )}
                      {post.contact_info && (
                        <p className="text-slate-600">
                          <span className="font-medium text-xs">Contact:</span> {post.contact_info}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Create modal */}
        {openCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>New classified</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpenCreateModal(false)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-title">Title *</Label>
                    <Input
                      id="create-title"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Bike for sale"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={form.category || ""}
                      onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-description">Description *</Label>
                    <textarea
                      id="create-description"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Describe your item or request..."
                      required
                      rows={4}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="create-visible"
                      checked={form.visible_to_other_colonies}
                      onCheckedChange={(checked) =>
                        setForm((f) => ({ ...f, visible_to_other_colonies: !!checked }))
                      }
                    />
                    <Label htmlFor="create-visible" className="text-sm font-normal">
                      Visible to other colonies
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-price">Price (optional)</Label>
                    <Input
                      id="create-price"
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.price}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, price: e.target.value === "" ? "" : e.target.value }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-contact">Contact info (optional)</Label>
                    <Input
                      id="create-contact"
                      value={form.contact_info}
                      onChange={(e) => setForm((f) => ({ ...f, contact_info: e.target.value }))}
                      placeholder="Unit number, email, or phone"
                    />
                  </div>
                  <div className="flex gap-2 border-t border-border pt-4">
                    <Button type="submit" disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenCreateModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
