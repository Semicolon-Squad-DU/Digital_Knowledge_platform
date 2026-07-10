"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Plus, Trash2, FlaskConical } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useResearchItem, useUpdateResearchOutput } from "@/features/research/hooks/useResearch";
import { useAuthStore } from "@/store/auth.store";
import { AppLayout } from "@/components/layout/AppLayout";

const OUTPUT_TYPES = [
  { value: "journal", label: "Journal" },
  { value: "conference", label: "Conference" },
  { value: "thesis", label: "Thesis" },
  { value: "dataset", label: "Dataset" },
  { value: "report", label: "Report" },
];

const authorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  affiliation: z.string().optional(),
});

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  output_type: z.string().min(1, "Type is required"),
  abstract: z.string().min(20, "Abstract must be at least 20 characters"),
  published_date: z.string().optional(),
  doi: z.string().optional(),
  journal_name: z.string().optional(),
  keywords_raw: z.string().optional(),
  authors: z.array(authorSchema).min(1, "At least one author is required"),
});

type FormValues = z.infer<typeof schema>;

export default function EditResearchPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const outputId = params?.id ?? "";
  const { user } = useAuthStore();
  const update = useUpdateResearchOutput();
  const { data: output, isLoading } = useResearchItem(outputId);

  const {
    register, handleSubmit, watch, setValue, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      output_type: "journal",
      authors: [],
    },
  });

  const authors = watch("authors");
  const outputType = watch("output_type");

  useEffect(() => {
    if (output) {
      // Auto-populate form once data is loaded
      reset({
        title: output.title,
        output_type: output.output_type,
        abstract: output.abstract || "",
        published_date: output.published_date ? new Date(output.published_date).toISOString().split("T")[0] : "",
        doi: output.doi || "",
        journal_name: output.journal_name || "",
        keywords_raw: Array.isArray(output.keywords) ? output.keywords.join(", ") : "",
        authors: Array.isArray(output.authors) ? output.authors : [],
      });
    }
  }, [output, reset]);

  const addAuthor = () => setValue("authors", [...authors, { name: "", email: "", affiliation: "" }]);
  const removeAuthor = (i: number) => setValue("authors", authors.filter((_, idx) => idx !== i));

  const onSubmit = async (values: FormValues) => {
    const keywords = values.keywords_raw
      ? values.keywords_raw.split(",").map(k => k.trim()).filter(Boolean)
      : [];

    const payload = {
      title: values.title,
      output_type: values.output_type as any,
      abstract: values.abstract,
      published_date: values.published_date || null,
      doi: values.doi || null,
      journal_name: values.journal_name || null,
      keywords,
      authors: values.authors.map(a => ({
        name: a.name,
        email: a.email || undefined,
        affiliation: a.affiliation || undefined,
      })),
    };

    try {
      await update.mutateAsync({ id: outputId, payload });
      toast.success("Research metadata updated successfully!");
      router.push(`/research/${outputId}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to update research. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="page-container py-16 text-center text-sm text-slate-500">
          Loading research metadata...
        </div>
      </AppLayout>
    );
  }

  // Guard access to the owning researcher only — admin manages the platform,
  // not individual researchers' own output.
  const isOwner = user && output?.uploaded_by === user.user_id;
  if (!isOwner) {
    return (
      <AppLayout>
        <div className="page-container py-16 text-center">
          <FlaskConical size={40} className="mx-auto mb-4 text-[var(--color-fg-muted)]" />
          <p className="font-semibold text-lg text-[var(--color-fg-default)]">Access Restricted</p>
          <p className="text-sm text-[var(--color-fg-muted)] mt-1">You do not have permission to edit this research output.</p>
        </div>
      </AppLayout>
    );
  }

  const showJournal = ["journal", "conference"].includes(outputType);

  return (
    <AppLayout>
      <div className="page-container py-8 max-w-3xl">
        <PageHeader
          title={<span className="font-extrabold text-[var(--avatar-theme-color,#1a1a2e)]">Edit Research Metadata</span>}
          subtitle={`Modify details for ${output?.dkp_identifier}`}
          breadcrumb={[
            { label: "Home", href: "/" },
            { label: "Research", href: "/research" },
            { label: output?.title ?? "Detail", href: `/research/${outputId}` },
            { label: "Edit" },
          ]}
        />

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          <section className="gh-box">
            <div className="gh-box-header">
              <h2 className="text-sm font-semibold text-[var(--color-fg-default)]">Basic Information</h2>
            </div>
            <div className="gh-box-body space-y-4">
              <Select
                label="Output Type"
                required
                options={OUTPUT_TYPES}
                error={errors.output_type?.message}
                {...register("output_type")}
              />
              <Input
                label="Title"
                required
                placeholder="e.g. Deep Learning Approaches for Bangla NLP"
                error={errors.title?.message}
                {...register("title")}
              />
              <Textarea
                label="Abstract"
                required
                rows={5}
                placeholder="Summarize your research objectives, methodology, and findings…"
                error={errors.abstract?.message}
                {...register("abstract")}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Published Date"
                  type="date"
                  error={errors.published_date?.message}
                  {...register("published_date")}
                />
                <Input
                  label="DOI"
                  placeholder="e.g. 10.1000/xyz123"
                  error={errors.doi?.message}
                  {...register("doi")}
                />
              </div>
              {showJournal && (
                <Input
                  label={outputType === "conference" ? "Conference Name" : "Journal / Publisher"}
                  placeholder={outputType === "conference" ? "e.g. ICML 2024" : "e.g. Nature, IEEE"}
                  error={errors.journal_name?.message}
                  {...register("journal_name")}
                />
              )}
              <Input
                label="Keywords"
                placeholder="Separate with commas, e.g. deep learning, NLP, Bangla"
                error={errors.keywords_raw?.message}
                {...register("keywords_raw")}
              />
            </div>
          </section>

          <section className="gh-box">
            <div className="gh-box-header flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-fg-default)]">
                Authors
                <span className="ml-2 text-xs font-normal text-[var(--color-fg-muted)]">({authors.length})</span>
              </h2>
              <Button
                type="button"
                size="sm"
                icon={<Plus size={13} />}
                onClick={addAuthor}
                style={{
                  background: "var(--theme-gradient-135, linear-gradient(135deg, #1a1a2e 0%, #111116 100%))",
                  color: "#ffffff",
                  border: "none",
                  boxShadow: "0 2px 6px rgba(26, 26, 46, 0.15)",
                }}
              >
                Add Author
              </Button>
            </div>
            <div className="gh-box-body space-y-4">
              {errors.authors?.root && (
                <p className="form-error">{errors.authors.root.message}</p>
              )}
              {authors.map((_, idx) => (
                <div key={idx} className="relative rounded-md border border-[var(--color-border-default)] p-4 bg-[var(--color-canvas-subtle)]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wide">
                      Author {idx + 1}
                    </span>
                    {authors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAuthor(idx)}
                        className="p-1 rounded text-[var(--color-danger-fg)] hover:bg-[var(--color-danger-subtle)] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Full Name"
                      required
                      placeholder="e.g. Dr. Rahim Uddin"
                      error={(errors.authors as any)?.[idx]?.name?.message}
                      {...register(`authors.${idx}.name`)}
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="author@university.edu"
                      error={(errors.authors as any)?.[idx]?.email?.message}
                      {...register(`authors.${idx}.email`)}
                    />
                    <Input
                      label="Affiliation"
                      placeholder="e.g. University of Dhaka"
                      error={(errors.authors as any)?.[idx]?.affiliation?.message}
                      {...register(`authors.${idx}.affiliation`)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button type="button" variant="invisible" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              loading={isSubmitting || update.isPending}
              icon={<FileText size={15} />}
              style={{
                background: "var(--theme-gradient-135, linear-gradient(135deg, #1a1a2e 0%, #111116 100%))",
                color: "#ffffff",
                border: "none",
                boxShadow: "0 4px 12px rgba(26, 26, 46, 0.2)",
              }}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
