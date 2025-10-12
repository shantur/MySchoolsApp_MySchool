/**
 * Attachment Download Script
 * 
 * Client-side script to enhance attachment download links with proper download handling.
 * This component injects JavaScript that intercepts download links and uses fetch
 * to download files as blobs, then triggers browser download with proper filename.
 * 
 * Note: Download URLs include access tokens, so no authentication is required.
 */

'use client';

import { useEffect } from 'react';

export default function AttachmentDownloadScript() {
  useEffect(() => {
    // Function to handle attachment download
    const handleDownloadClick = async (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
      
      // Only handle links with the attachment-download-link class
      if (!target.classList.contains('attachment-download-link')) {
        return;
      }
      
      e.preventDefault();
      
      const url = target.href;
      const fileName = target.getAttribute('data-attachment-filename') || 'download';
      
      // Show loading state
      const originalText = target.textContent;
      target.textContent = 'Downloading...';
      target.style.opacity = '0.6';
      target.style.pointerEvents = 'none';
      
      try {
        // Fetch the file
        // Note: No credentials needed since URL includes download token
        const response = await fetch(url, {
          method: 'GET',
        });
        
        if (!response.ok) {
          throw new Error(`Download failed: ${response.statusText}`);
        }
        
        // Get the blob from response
        const blob = await response.blob();
        
        // Create a temporary download link
        const blobUrl = window.URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);
        
        // Restore link state
        target.textContent = originalText;
        target.style.opacity = '1';
        target.style.pointerEvents = 'auto';
        
      } catch (error) {
        console.error('Download error:', error);
        
        // Show error state
        target.textContent = originalText;
        target.style.opacity = '1';
        target.style.pointerEvents = 'auto';
        
        // Show error message
        alert('Failed to download attachment. Please try again.');
      }
    };
    
    // Add event listener to the document for event delegation
    document.addEventListener('click', handleDownloadClick);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleDownloadClick);
    };
  }, []);
  
  return null; // This component doesn't render anything
}
