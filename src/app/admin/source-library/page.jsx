'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input, Label } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  Database,
  PlusCircle,
  ArrowLeft,
  FileText,
  Trash2,
  Eye,
  RefreshCw,
  Upload,
  CheckCircle,
  Layers,
} from 'lucide-react';

export default function SourceLibraryPage() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload Modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [filename, setFilename] = useState('');
  const [fileType, setFileType] = useState('pdf');
  const [rawContent, setRawContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Chunks Inspection Modal
  const [chunksModalOpen, setChunksModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [chunksLoading, setChunksLoading] = useState(false);

  // Sync Revision Modal
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [newRevisionText, setNewRevisionText] = useState('');
  const [revisionChangelog, setRevisionChangelog] = useState('');

  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/sources');
      const data = await res.json();
      if (data.success) {
        setSources(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title.trim() || !rawContent.trim()) {
      alert('Title and content are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/v1/sources/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          originalFilename: filename.trim() || `${title.toLowerCase().replace(/\s+/g, '-')}.${fileType}`,
          fileType,
          fileSize: rawContent.length,
          rawContent: rawContent.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUploadModalOpen(false);
        setTitle('');
        setFilename('');
        setRawContent('');
        fetchSources();
      } else {
        alert(data.error?.message || 'Upload failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInspectChunks = async (doc) => {
    setSelectedDoc(doc);
    setChunksModalOpen(true);
    setChunksLoading(true);
    try {
      const res = await fetch(`/api/v1/sources/${doc._id}`);
      const data = await res.json();
      if (data.success) {
        setChunks(data.data.chunks || []);
      }
    } finally {
      setChunksLoading(false);
    }
  };

  const handleSyncRevision = async (e) => {
    e.preventDefault();
    if (!selectedDoc || !newRevisionText.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/sources/${selectedDoc._id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newContent: newRevisionText.trim(),
          changelog: revisionChangelog.trim() || 'Manual revision upload',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSyncModalOpen(false);
        setNewRevisionText('');
        setRevisionChangelog('');
        alert(`Revision synced! ${data.data.affectedCoursesCount} mapped courses notified of document changes.`);
        fetchSources();
      } else {
        alert(data.error?.message || 'Sync failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Delete this source document and all associated semantic chunks?')) return;
    try {
      const res = await fetch(`/api/v1/sources/${docId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchSources();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/studio" className="text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              AI Studio
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-7 h-7 text-emerald-600" />
            Source Document Ingestion Library
          </h1>
          <p className="text-sm text-slate-500">
            Upload enterprise documentation, technical specs, manuals, and PDFs for semantic vector indexing.
          </p>
        </div>
        <div>
          <Button onClick={() => setUploadModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Upload Document
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Source Documents ({sources.length})</CardTitle>
          <CardDescription>
            Documents chunked, embedded, and ready for citation grounding.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Title</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Chunks</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Uploaded On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    Loading source library...
                  </TableCell>
                </TableRow>
              ) : sources.length === 0 ? (
                <TableEmpty
                  colSpan={7}
                  title="No source documents in library"
                  description="Upload your first technical guide or PDF manual to enable source-grounded course creation."
                  action={
                    <Button size="sm" onClick={() => setUploadModalOpen(true)}>
                      <Upload className="w-4 h-4 mr-1" /> Upload Document
                    </Button>
                  }
                />
              ) : (
                sources.map((doc) => (
                  <TableRow key={doc._id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-slate-900">{doc.title}</div>
                        <div className="text-xs text-slate-400">{doc.originalFilename}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                        {doc.fileType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={doc.status === 'PROCESSED' ? 'success' : doc.status === 'PROCESSING' ? 'warning' : 'outline'}>
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700">
                      {doc.chunkCount || 0} chunks ({doc.pageCount || 1} pages)
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-500">
                      v{doc.currentVersion || 1}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleInspectChunks(doc)}
                          title="Inspect Semantic Chunks"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setSyncModalOpen(true);
                          }}
                          title="Upload Revision / Sync"
                        >
                          <RefreshCw className="w-4 h-4 text-emerald-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doc._id)}
                          className="text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* UPLOAD MODAL */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Source Document"
        description="Ingest technical documentation and immediately trigger semantic chunking."
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Label required>Document Title</Label>
            <Input
              placeholder="e.g. Distributed Consensus Architecture Manual"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>File Format</Label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="pdf">PDF Document (.pdf)</option>
                <option value="docx">Word Document (.docx)</option>
                <option value="pptx">Presentation (.pptx)</option>
                <option value="md">Markdown (.md)</option>
                <option value="txt">Plain Text (.txt)</option>
              </select>
            </div>
            <div>
              <Label>Filename</Label>
              <Input
                placeholder="manual.pdf"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label required>Raw Document Content / Text</Label>
            <textarea
              rows={8}
              placeholder="Paste the extracted or original document text here to run semantic chunking and embedding generation..."
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <ModalFooter>
            <Button variant="outline" type="button" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Ingest & Index
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* CHUNKS INSPECT MODAL */}
      <Modal
        isOpen={chunksModalOpen}
        onClose={() => setChunksModalOpen(false)}
        title={`Semantic Chunks: ${selectedDoc?.title || ''}`}
        description="Inspect indexed text passages and vector embeddings."
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {chunksLoading ? (
            <div className="py-12 text-center text-slate-500 text-xs">Loading chunks...</div>
          ) : chunks.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No chunks indexed.</div>
          ) : (
            chunks.map((chk) => (
              <div key={chk._id} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Chunk #{chk.chunkIndex + 1} (Page {chk.pageNumber})</span>
                  <span className="text-[10px] text-emerald-600 font-mono">
                    {chk.embedding?.length || 0}-dim vector
                  </span>
                </div>
                <p className="text-slate-600 italic leading-relaxed">&ldquo;{chk.content}&rdquo;</p>
              </div>
            ))
          )}
        </div>
        <ModalFooter>
          <Button onClick={() => setChunksModalOpen(false)}>Close</Button>
        </ModalFooter>
      </Modal>

      {/* SYNC REVISION MODAL */}
      <Modal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        title="Living Course / Sync Document Revision"
        description="Upload an updated version of this source document. AI Academy will detect changes and update mapped courses."
      >
        <form onSubmit={handleSyncRevision} className="space-y-4">
          <div>
            <Label required>Changelog / Revision Notes</Label>
            <Input
              placeholder="e.g. Added section 4 on Redis Streams"
              value={revisionChangelog}
              onChange={(e) => setRevisionChangelog(e.target.value)}
              required
            />
          </div>

          <div>
            <Label required>Updated Content</Label>
            <textarea
              rows={6}
              placeholder="Paste updated document text..."
              value={newRevisionText}
              onChange={(e) => setNewRevisionText(e.target.value)}
              className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <ModalFooter>
            <Button variant="outline" type="button" onClick={() => setSyncModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Process Revision
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}

