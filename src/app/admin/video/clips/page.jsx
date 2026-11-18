'use client';

import React from 'react';
import { VideoClipStudio } from '@/components/video/VideoClipStudio';

export default function AdminVideoClipsPage() {
  return <VideoClipStudio isAdmin={true} />;
}
