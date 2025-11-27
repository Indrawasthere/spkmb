import { Modal } from '../ui/modal';
import { Download, FileText, ExternalLink } from 'lucide-react';
import Badge from '../ui/badge/Badge';

interface DetailField {
  label: string;
  value: string | number | React.ReactNode;
  fullWidth?: boolean;
}

interface DetailSection {
  title: string;
  fields: DetailField[];
}

interface Document {
  id: string;
  namaDokumen: string;
  filePath: string;
  uploadedAt: string;
  fileSize?: number;
  mimeType?: string;
  jenisDokumen?: string;
}

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sections: DetailSection[];
  documents?: Document[];
}

// Helper function to get the correct base URL
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

// Helper function to get full file URL
const getFileUrl = (filePath: string) => {
  if (!filePath) return '';
  
  // If filePath already contains full URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // If filePath starts with /uploads, construct full URL
  if (filePath.startsWith('/uploads')) {
    return `${getBaseUrl()}${filePath}`;
  }
  
  // If filePath doesn't start with /, add it
  return `${getBaseUrl()}/uploads/${filePath}`;
};

// Format file size
const formatFileSize = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const DetailsModal = ({ isOpen, onClose, title, sections, documents = [] }: DetailsModalProps) => {
  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const fullUrl = getFileUrl(filePath);
      
      // Cek jika file bisa diakses
      const response = await fetch(fullUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error('File tidak ditemukan');
      }

      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = fileName || 'document';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Gagal mengunduh file. Silakan coba lagi atau hubungi administrator.');
    }
  };

  const handlePreview = (filePath: string) => {
    try {
      const fullUrl = getFileUrl(filePath);
      window.open(fullUrl, '_blank', 'noopener,noreferrer,width=1200,height=800');
    } catch (error) {
      console.error('Preview error:', error);
      alert('Gagal membuka preview. Silakan coba lagi.');
    }
  };

  const getFileType = (filePath: string, mimeType?: string) => {
    if (mimeType) {
      if (mimeType.includes('pdf')) return 'pdf';
      if (mimeType.includes('image')) return 'image';
      if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
      if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet';
    }
    
    const extension = filePath.split('.').pop()?.toLowerCase();
    return extension || 'file';
  };

  const canPreview = (filePath: string, mimeType?: string) => {
    const fileType = getFileType(filePath, mimeType);
    return fileType === 'pdf' || fileType === 'image';
  };

  const getFileIcon = (filePath: string, mimeType?: string) => {
    const fileType = getFileType(filePath, mimeType);
    
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />;
      case 'image':
        return <FileText className="w-5 h-5 text-green-500 flex-shrink-0" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />;
      case 'spreadsheet':
        return <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" title={title} showHeader={true}>
      <div className="max-h-[80vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Sections */}
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b pb-2">
                {section.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields.map((field, fieldIdx) => (
                  <div 
                    key={fieldIdx} 
                    className={field.fullWidth ? 'md:col-span-2' : ''}
                  >
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {field.label}
                    </p>
                    <div className="text-base text-gray-900 dark:text-white break-words">
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Documents Section */}
          {documents && documents.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b pb-2">
                Dokumen Terlampir ({documents.length})
              </h3>
              <div className="space-y-3">
                {documents.map((doc) => {
                  const canPreviewFile = canPreview(doc.filePath, doc.mimeType);
                  
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {getFileIcon(doc.filePath, doc.mimeType)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {doc.namaDokumen}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>{formatDate(doc.uploadedAt)}</span>
                            {doc.fileSize && (
                              <span>• {formatFileSize(doc.fileSize)}</span>
                            )}
                            {doc.jenisDokumen && (
                              <span>• {doc.jenisDokumen}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {canPreviewFile && (
                          <button
                            onClick={() => handlePreview(doc.filePath)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors border border-green-200 dark:border-green-800"
                            title="Preview Dokumen"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Preview
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(doc.filePath, doc.namaDokumen)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors border border-blue-200 dark:border-blue-800"
                          title="Download Dokumen"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Tidak ada dokumen terlampir</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};