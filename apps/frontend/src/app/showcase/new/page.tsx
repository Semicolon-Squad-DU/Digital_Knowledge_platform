"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Plus, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useSubmitProject } from "@/hooks/useLibrary";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import toast from "react-hot-toast";

const DEPARTMENTS = ["CSE", "EEE", "ME", "CE", "BBA", "English", "Physics", "Other"];
const SEMESTERS   = ["Spring 2024", "Fall 2024", "Spring 2025", "Fall 2025"];

interface TeamMember {
  name: string;
  student_id: string;
}

export default function NewStudentProjectPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const { mutateAsync: submitProject, isPending } = useSubmitProject();

  // Form state
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [semester, setSemester] = useState(SEMESTERS[0]);
  const [technologies, setTechnologies] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([{ name: "", student_id: "" }]);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const canSubmit = ["student_author", "researcher", "admin"].includes(user.role);
  if (!canSubmit) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-500">You do not have permission to submit a project.</p>
      </div>
    );
  }

  const addMember = () =>
    setTeamMembers((prev) => [...prev, { name: "", student_id: "" }]);

  const removeMember = (idx: number) =>
    setTeamMembers((prev) => prev.filter((_, i) => i !== idx));

  const updateMember = (idx: number, field: keyof TeamMember, value: string) =>
    setTeamMembers((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!abstract.trim()) { toast.error("Abstract is required"); return; }
    if (teamMembers.some((m) => !m.name.trim())) {
      toast.error("All team member names are required");
      return;
    }

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("abstract", abstract.trim());
    fd.append("department", department);
    fd.append("semester", semester);
    fd.append(
      "technologies",
      JSON.stringify(technologies.split(",").map((t) => t.trim()).filter(Boolean))
    );
    fd.append("team_members", JSON.stringify(teamMembers.filter((m) => m.name.trim())));
    if (reportFile) fd.append("file", reportFile);

    try {
      await submitProject(fd);
      toast.success("Project submitted successfully!");
      router.push("/showcase");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to submit project");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Submit Project"
        subtitle="Share your work with the DKP Student Showcase"
        breadcrumb={[
          { label: "Showcase", href: "/showcase" },
          { label: "Submit Project" },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        {/* Title */}
        <Input
          label="Project Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Smart Library Management System"
          required
        />

        {/* Abstract */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Abstract <span className="text-red-500">*</span>
          </label>
          <textarea
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            rows={5}
            placeholder="Provide a concise description of your project, its objectives, and outcomes."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            required
          />
        </div>

        {/* Department + Semester */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Technologies */}
        <Input
          label="Technologies Used"
          value={technologies}
          onChange={(e) => setTechnologies(e.target.value)}
          placeholder="React, Node.js, PostgreSQL (comma-separated)"
          hint="Separate multiple technologies with commas"
        />

        {/* Team Members */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700">
              Team Members <span className="text-red-500">*</span>
            </label>
            <Button type="button" variant="outline" size="sm" onClick={addMember} icon={<Plus size={13} />}>
              Add Member
            </Button>
          </div>
          <div className="space-y-3">
            {teamMembers.map((member, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="flex-1">
                  <Input
                    placeholder="Full name"
                    value={member.name}
                    onChange={(e) => updateMember(idx, "name", e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="Student ID"
                    value={member.student_id}
                    onChange={(e) => updateMember(idx, "student_id", e.target.value)}
                  />
                </div>
                {teamMembers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMember(idx)}
                    className="mt-2 text-slate-400 hover:text-red-500 transition-colors"
                    aria-label="Remove team member"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* PDF Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Project Report (PDF)</label>
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={24} className="mx-auto text-slate-400 mb-2" />
            {reportFile ? (
              <p className="text-sm font-medium text-slate-700">{reportFile.name}</p>
            ) : (
              <p className="text-sm text-slate-500">Click to upload PDF report</p>
            )}
            <p className="text-xs text-slate-400 mt-1">PDF, max 50 MB</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setReportFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Submit Project
          </Button>
        </div>
      </form>
    </div>
  );
}
