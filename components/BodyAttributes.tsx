"use client";

import { useEffect } from 'react';

export default function BodyAttributes() {
  useEffect(() => {
    // Remove any attributes added by browser extensions
    const body = document.body;
    if (body.hasAttribute('cz-shortcut-listen')) {
      body.removeAttribute('cz-shortcut-listen');
    }
  }, []);

  return null;
} 