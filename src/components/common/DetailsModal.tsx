import { Modal } from '../ui/modal';
import { X, Download, FileText } from 'lucide-react';
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

export const DetailsModal = ({ isOpen, onClose, title, sections, documents }: DetailsModalProps) => {
  const handleDownload = (filePath: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `http://localhost:3001${filePath}`;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {doc.namaDokumen}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(doc.uploadedAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(doc.filePath, doc.namaDokumen)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-900/20"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                ))}
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