'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Upload,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileCheck,
  Eye,
  Trash2,
} from 'lucide-react';

interface ContractRecord {
  id: string;
  title: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  pageCount?: number;
  status: string;
  uploadedAt: string;
  _count?: {
    obligations: number;
    deadlines: number;
    conflicts: number;
  };
}

interface UploadSuccessData {
  id: string;
  title: string;
  fileName: string;
  pageCount?: number;
  status: string;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contractTitle, setContractTitle] = useState('');
  const [uploadStage, setUploadStage] = useState<
    'IDLE' | 'VALIDATING' | 'UPLOADING' | 'EXTRACTING' | 'SAVING' | 'SUCCESS' | 'ERROR'
  >('IDLE');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessData, setUploadSuccessData] = useState<UploadSuccessData | null>(null);

  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadContracts() {
      try {
        const res = await fetch('/api/contracts');
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.data)) {
          setContracts(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch contracts:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadContracts();
    return () => {
      isMounted = false;
    };
  }, [reloadTick]);

  const fetchContracts = () => setReloadTick((prev) => prev + 1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!contractTitle) {
        setContractTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      setUploadError(null);
      setUploadStage('IDLE');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a PDF or DOCX contract file to upload.');
      return;
    }

    try {
      setUploadError(null);
      setUploadStage('VALIDATING');

      // Client-side quick checks
      const ext = selectedFile.name.slice(selectedFile.name.lastIndexOf('.')).toLowerCase();
      if (!['.pdf', '.docx'].includes(ext)) {
        throw new Error('Only PDF (.pdf) and Word (.docx) files are supported.');
      }
      if (selectedFile.size > 25 * 1024 * 1024) {
        throw new Error('File size exceeds the 25MB limit.');
      }

      setUploadStage('UPLOADING');

      const formData = new FormData();
      formData.append('file', selectedFile);
      if (contractTitle) {
        formData.append('title', contractTitle);
      }

      setUploadStage('EXTRACTING');

      const res = await fetch('/api/contracts/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadStage('SAVING');

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Contract upload and extraction failed.');
      }

      setUploadStage('SUCCESS');
      setUploadSuccessData(data.data);
      fetchContracts();
    } catch (err: unknown) {
      const eObj = err as { message?: string };
      setUploadStage('ERROR');
      setUploadError(eObj.message || 'An error occurred during upload.');
    }
  };

  const resetUploadModal = () => {
    setSelectedFile(null);
    setContractTitle('');
    setUploadStage('IDLE');
    setUploadError(null);
    setUploadSuccessData(null);
    setIsUploadOpen(false);
  };

  const handleDeleteContract = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete contract "${title}"?`)) return;

    try {
      const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchContracts();
      }
    } catch (err) {
      console.error('Failed to delete contract:', err);
      alert('Failed to delete contract');
    }
  };

  // Filtered Contracts List
  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contract Management"
        description="Upload PDF or DOCX supplier & service contracts for text parsing and clause extraction."
        badgeText="Ingestion Engine"
        action={
          <Button
            onClick={() => {
              resetUploadModal();
              setIsUploadOpen(true);
            }}
            className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Contract</span>
          </Button>
        }
      />

      {/* Toolbar */}
      <Card className="border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="text"
              placeholder="Search by title or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Filter className="h-3.5 w-3.5" />
              <span>Status:</span>
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_ANALYSIS">Pending Analysis</option>
              <option value="ANALYZED">Analyzed</option>
              <option value="COMPLIANCE_REVIEW">Compliance Review</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Contracts Data Table */}
      <Card className="border-slate-800 bg-slate-900/70">
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract Title</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                      <span className="text-xs text-slate-400">Loading stored contracts...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <EmptyState
                      icon={FileText}
                      title="No Contracts Found"
                      description="Upload a PDF or DOCX contract to extract text and view source pages."
                      actionText="Upload Contract Document"
                      onAction={() => {
                        resetUploadModal();
                        setIsUploadOpen(true);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-slate-800/60"
                  >
                    <TableCell className="font-semibold text-white">
                      <Link href={`/contracts/${c.id}`} className="hover:text-indigo-400 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                        <span>{c.title}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-400">{c.fileName}</TableCell>
                    <TableCell className="text-xs text-slate-300">{c.pageCount || 1} pages</TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {c.fileSize ? `${(c.fileSize / 1024).toFixed(1)} KB` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success" className="text-[10px]">
                        TEXT EXTRACTED
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {new Date(c.uploadedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/contracts/${c.id}`}>
                          <Button variant="outline" size="sm" className="h-8 px-2 text-xs border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700">
                            <Eye className="h-3.5 w-3.5 mr-1 text-indigo-400" />
                            View Text
                          </Button>
                        </Link>
                        <Button
                          onClick={(e) => handleDeleteContract(c.id, c.title, e)}
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-rose-400 hover:bg-rose-950 hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upload Contract Dialog Modal with Live Real-time Progress */}
      <Dialog
        isOpen={isUploadOpen}
        onClose={resetUploadModal}
        title="Upload Contract Document"
        description="Select a PDF or DOCX contract for storage and clause extraction."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 pt-2">
          {/* Error Banner */}
          {uploadError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Success Banner */}
          {uploadStage === 'SUCCESS' && uploadSuccessData && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2 text-xs text-emerald-300">
              <div className="flex items-center gap-2 font-semibold text-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Document Text Extracted Successfully!</span>
              </div>
              <div className="space-y-1 text-slate-300 text-[11px] font-mono border-t border-emerald-500/20 pt-2">
                <p>• Title: {uploadSuccessData.title}</p>
                <p>• Pages Preserved: {uploadSuccessData.pageCount}</p>
                <p>• Status: {uploadSuccessData.status}</p>
              </div>
              <div className="pt-2">
                <Link href={`/contracts/${uploadSuccessData.id}`}>
                  <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                    Open Extracted Contract Text Preview
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {uploadStage !== 'SUCCESS' && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Contract Title (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Master Services Agreement 2026"
                  value={contractTitle}
                  onChange={(e) => setContractTitle(e.target.value)}
                  disabled={uploadStage !== 'IDLE' && uploadStage !== 'ERROR'}
                />
              </div>

              {/* Drag & Drop File Input */}
              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 text-center bg-slate-950/60 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  disabled={uploadStage !== 'IDLE' && uploadStage !== 'ERROR'}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <FileCheck className="mx-auto h-8 w-8 text-indigo-400 mb-2" />
                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-indigo-300">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-200">
                      Click to choose or drag contract file here
                    </p>
                    <p className="text-[10px] text-slate-500">PDF or DOCX format (Max 25MB)</p>
                  </div>
                )}
              </div>

              {/* Real-time Progress Bar Indicator */}
              {uploadStage !== 'IDLE' && uploadStage !== 'ERROR' && (
                <div className="space-y-2 py-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium text-indigo-300">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                      {uploadStage === 'VALIDATING' && 'Validating file format & size...'}
                      {uploadStage === 'UPLOADING' && 'Uploading contract document...'}
                      {uploadStage === 'EXTRACTING' && 'Parsing & extracting page text...'}
                      {uploadStage === 'SAVING' && 'Saving contract & pages to PostgreSQL...'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-indigo-500 transition-all duration-300 ${
                        uploadStage === 'VALIDATING'
                          ? 'w-1/4'
                          : uploadStage === 'UPLOADING'
                          ? 'w-2/4'
                          : uploadStage === 'EXTRACTING'
                          ? 'w-3/4'
                          : 'w-full'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetUploadModal}
                  disabled={uploadStage !== 'IDLE' && uploadStage !== 'ERROR'}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedFile || (uploadStage !== 'IDLE' && uploadStage !== 'ERROR')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Start Extraction Pipeline
                </Button>
              </div>
            </>
          )}
        </form>
      </Dialog>
    </div>
  );
}
