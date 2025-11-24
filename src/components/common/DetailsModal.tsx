import { Modal } from '../ui/modal';
import { X, Download, FileText, ExternalLink } from 'lucide-react';
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

export const DetailsModal = ({ isOpen, onClose, title, sections, documents }: DetailsModalProps) => {
  const handleDownload = (filePath: string, fileName: string) => {
    try {
      const fullUrl = getFileUrl(filePath);
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Gagal mengunduh file. Silakan coba lagi.');
    }
  };

  const handlePreview = (filePath: string) => {
    try {
      const fullUrl = getFileUrl(filePath);
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Preview error:', error);
      alert('Gagal membuka preview. Silakan coba lagi.');
    }
  };

  const getFileType = (filePath: string) => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    return extension || '';
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
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {field.label}
                    </p>
                    <div className="text-base font-medium text-gray-900 dark:text-white">
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Documents Section */}
          {documents && documents.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b pb-2">
                Dokumen Terlampir
              </h3>
              <div className="space-y-2">
                {documents.map((doc) => {
                  const fileType = getFileType(doc.filePath);
                  const isPDF = fileType === 'pdf';
                  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileType);
                  
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {doc.namaDokumen}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.uploadedAt).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(isPDF || isImage) && (
                          <button
                            onClick={() => handlePreview(doc.filePath)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors dark:hover:bg-green-900/20"
                            title="Preview"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Preview
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(doc.filePath, doc.namaDokumen)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-900/20"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};