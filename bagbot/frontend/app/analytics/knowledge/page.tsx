'use client';

import { useState, useEffect } from 'react';
import { NeonCard } from '@/components/neon/NeonCard';
import { NeonButton } from '@/components/neon/NeonButton';
import { NeonBadge } from '@/components/neon/NeonBadge';
import { Modal } from '@/components/neon/Modal';
import { AlertPanel } from '@/components/neon/AlertPanel';
import { MetricCard } from '@/components/neon/MetricCard';
import { Upload, Book, FileText, Brain, Link2, Search } from 'lucide-react';

interface KnowledgeData {
  totalDocuments: number;
  totalConcepts: number;
  totalCorrelations: number;
  lastProcessed: string;
  documents: ProcessedDocument[];
  concepts: Concept[];
  correlations: Correlation[];
}

interface ProcessedDocument {
  id: string;
  title: string;
  type: 'book' | 'article' | 'research';
  uploadDate: string;
  pages: number;
  concepts: number;
  summary: string;
  status: 'processing' | 'completed' | 'error';
}

interface Concept {
  id: string;
  name: string;
  category: string;
  mentions: number;
  relatedStrategies: string[];
}

interface Correlation {
  concept1: string;
  concept2: string;
  strength: number;
  description: string;
}

export default function KnowledgeIntelligencePage() {
  const [data, setData] = useState<KnowledgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ProcessedDocument | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchKnowledgeData();
  }, []);

  const fetchKnowledgeData = async () => {
    try {
      const response = await fetch('/api/knowledge/list');
      const fetchedData = await response.json();
      setData(fetchedData || mockData);
    } catch (error) {
      console.error('Failed to fetch knowledge data:', error);
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setUploadModalOpen(false);
        setSelectedFile(null);
        fetchKnowledgeData();
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
    } finally {
      setUploading(false);
    }
  };

  const openDocumentDetail = (doc: ProcessedDocument) => {
    setSelectedDocument(doc);
    setDetailModalOpen(true);
  };

  const searchConcepts = async () => {
    if (!searchQuery) return;
    
    try {
      const response = await fetch(`/api/knowledge/search?q=${encodeURIComponent(searchQuery)}`);
      const results = await response.json();
      console.log('Search results:', results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin-slow w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  const filteredConcepts = searchQuery
    ? data.concepts.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : data.concepts;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Knowledge Intelligence</h1>
            <p className="text-gray-400">AI-powered knowledge extraction and strategy correlation</p>
          </div>
          <NeonButton
            variant="primary"
            onClick={() => setUploadModalOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </NeonButton>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Documents"
          value={data.totalDocuments}
          subtitle="Total processed"
          icon={<Book />}
          glow="cyan"
        />
        
        <MetricCard
          title="Concepts"
          value={data.totalConcepts}
          subtitle="Extracted insights"
          icon={<Brain />}
          glow="magenta"
        />
        
        <MetricCard
          title="Correlations"
          value={data.totalCorrelations}
          subtitle="Strategy connections"
          icon={<Link2 />}
          glow="green"
        />
        
        <MetricCard
          title="Last Processed"
          value={new Date(data.lastProcessed).toLocaleDateString()}
          subtitle={new Date(data.lastProcessed).toLocaleTimeString()}
          icon={<FileText />}
          glow="yellow"
        />
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <NeonCard glow="cyan">
          <div className="p-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search concepts, strategies, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchConcepts()}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white
                           focus:border-neon-cyan focus:outline-none"
                />
              </div>
              <NeonButton variant="primary" onClick={searchConcepts}>
                Search
              </NeonButton>
            </div>
          </div>
        </NeonCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Processed Documents */}
        <div className="lg:col-span-2">
          <NeonCard glow="magenta">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Processed Documents</h3>
              <div className="space-y-3">
                {data.documents.length > 0 ? (
                  data.documents.map(doc => (
                    <div 
                      key={doc.id}
                      className="p-4 bg-gray-900/30 rounded-lg border border-gray-800 cursor-pointer hover:border-neon-magenta/50 transition-colors"
                      onClick={() => openDocumentDetail(doc)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1">
                          <Book className="w-5 h-5 text-neon-magenta flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-semibold truncate">{doc.title}</h4>
                            <p className="text-sm text-gray-400">
                              {doc.pages} pages • {doc.concepts} concepts extracted
                            </p>
                          </div>
                        </div>
                        <NeonBadge 
                          variant={
                            doc.status === 'completed' ? 'green' :
                            doc.status === 'processing' ? 'yellow' : 'red'
                          }
                          size="sm"
                        >
                          {doc.status.toUpperCase()}
                        </NeonBadge>
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                        {doc.summary}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <NeonBadge variant="cyan" size="sm">
                          {doc.type.toUpperCase()}
                        </NeonBadge>
                        <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Book className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">No documents processed yet</p>
                    <NeonButton variant="primary" onClick={() => setUploadModalOpen(true)}>
                      Upload Your First Document
                    </NeonButton>
                  </div>
                )}
              </div>
            </div>
          </NeonCard>
        </div>

        {/* Top Concepts */}
        <div>
          <NeonCard glow="green">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Top Concepts</h3>
              <div className="space-y-3">
                {filteredConcepts.slice(0, 10).map(concept => (
                  <div key={concept.id} className="p-3 bg-gray-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{concept.name}</span>
                      <NeonBadge variant="green" size="sm">
                        {concept.mentions}
                      </NeonBadge>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {concept.category}
                    </div>
                    {concept.relatedStrategies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {concept.relatedStrategies.map((strategy, idx) => (
                          <span 
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan rounded"
                          >
                            {strategy}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </NeonCard>
        </div>
      </div>

      {/* Strategy Correlations */}
      <NeonCard glow="yellow">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-neon-yellow" />
            <h3 className="text-lg font-bold text-white">Strategy Correlations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.correlations.map((corr, idx) => (
              <div key={idx} className="p-4 bg-gray-900/30 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <NeonBadge variant="cyan" size="sm">{corr.concept1}</NeonBadge>
                    <span className="text-gray-500">↔</span>
                    <NeonBadge variant="magenta" size="sm">{corr.concept2}</NeonBadge>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Strength</div>
                    <div className={`text-lg font-bold ${
                      corr.strength > 0.7 ? 'text-neon-green' :
                      corr.strength > 0.4 ? 'text-neon-yellow' : 'text-gray-400'
                    }`}>
                      {(corr.strength * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-400">{corr.description}</p>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      corr.strength > 0.7 ? 'bg-neon-green' :
                      corr.strength > 0.4 ? 'bg-neon-yellow' : 'bg-gray-600'
                    }`}
                    style={{ width: `${corr.strength * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </NeonCard>

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Document"
        glow="cyan"
      >
        <div className="space-y-4">
          <AlertPanel
            title="Supported Formats"
            message="Upload PDF documents for AI-powered knowledge extraction and strategy correlation analysis."
            type="info"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select PDF Document
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white
                       focus:border-neon-cyan focus:outline-none"
            />
          </div>

          {selectedFile && (
            <div className="p-3 bg-gray-900 rounded border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-neon-cyan" />
                <p className="text-white font-medium">{selectedFile.name}</p>
              </div>
              <p className="text-sm text-gray-400">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <NeonButton
              variant="primary"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              loading={uploading}
            >
              {uploading ? 'Processing...' : 'Upload & Process'}
            </NeonButton>
            <NeonButton
              variant="secondary"
              onClick={() => setUploadModalOpen(false)}
            >
              Cancel
            </NeonButton>
          </div>
        </div>
      </Modal>

      {/* Document Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedDocument?.title || 'Document Details'}
        size="lg"
        glow="magenta"
      >
        {selectedDocument && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-900/30 rounded">
                <p className="text-sm text-gray-400 mb-1">Type</p>
                <NeonBadge variant="cyan">{selectedDocument.type.toUpperCase()}</NeonBadge>
              </div>
              <div className="p-3 bg-gray-900/30 rounded">
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <NeonBadge 
                  variant={
                    selectedDocument.status === 'completed' ? 'green' :
                    selectedDocument.status === 'processing' ? 'yellow' : 'red'
                  }
                >
                  {selectedDocument.status.toUpperCase()}
                </NeonBadge>
              </div>
              <div className="p-3 bg-gray-900/30 rounded">
                <p className="text-sm text-gray-400 mb-1">Pages</p>
                <p className="text-white font-medium">{selectedDocument.pages}</p>
              </div>
              <div className="p-3 bg-gray-900/30 rounded">
                <p className="text-sm text-gray-400 mb-1">Concepts Extracted</p>
                <p className="text-white font-medium">{selectedDocument.concepts}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-2">AI Summary</h4>
              <div className="p-4 bg-gray-900/30 rounded-lg border border-gray-800">
                <p className="text-gray-300">{selectedDocument.summary}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <NeonButton variant="secondary">
                View Full Analysis
              </NeonButton>
              <NeonButton variant="secondary">
                Download Report
              </NeonButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Mock data
const mockData: KnowledgeData = {
  totalDocuments: 15,
  totalConcepts: 342,
  totalCorrelations: 87,
  lastProcessed: new Date().toISOString(),
  documents: [
    {
      id: '1',
      title: 'Market Wizards by Jack Schwager',
      type: 'book',
      uploadDate: '2024-11-20T10:30:00Z',
      pages: 486,
      concepts: 58,
      summary: 'Comprehensive interviews with top traders revealing their strategies, psychology, and risk management approaches. Key insights include position sizing, emotional discipline, and systematic approach to trading.',
      status: 'completed'
    },
    {
      id: '2',
      title: 'Trading in the Zone by Mark Douglas',
      type: 'book',
      uploadDate: '2024-11-18T14:22:00Z',
      pages: 240,
      concepts: 42,
      summary: 'Deep dive into trading psychology and developing the mindset of a professional trader. Focuses on probability thinking, consistency, and overcoming psychological barriers.',
      status: 'completed'
    },
    {
      id: '3',
      title: 'ICT Concepts - Order Blocks & FVG',
      type: 'research',
      uploadDate: '2024-11-15T09:15:00Z',
      pages: 120,
      concepts: 35,
      summary: 'Detailed explanation of Inner Circle Trader concepts including order blocks, fair value gaps, liquidity pools, and market structure analysis for precision entries.',
      status: 'completed'
    },
    {
      id: '4',
      title: 'Algorithmic Trading Strategies',
      type: 'research',
      uploadDate: '2024-11-10T11:45:00Z',
      pages: 95,
      concepts: 28,
      summary: 'Technical analysis of algorithmic trading strategies including mean reversion, momentum, and statistical arbitrage with backtesting methodologies.',
      status: 'completed'
    }
  ],
  concepts: [
    {
      id: '1',
      name: 'Order Blocks',
      category: 'Price Action',
      mentions: 127,
      relatedStrategies: ['OB Hunter', 'Breaker Blocks', 'HTF Combo']
    },
    {
      id: '2',
      name: 'Risk Management',
      category: 'Trading Psychology',
      mentions: 215,
      relatedStrategies: ['All Strategies']
    },
    {
      id: '3',
      name: 'Fair Value Gaps',
      category: 'Price Action',
      mentions: 98,
      relatedStrategies: ['FVG', 'Breaker Blocks']
    },
    {
      id: '4',
      name: 'Liquidity Pools',
      category: 'Market Structure',
      mentions: 156,
      relatedStrategies: ['Liquidity Sweeps', 'OB Hunter']
    },
    {
      id: '5',
      name: 'Emotional Discipline',
      category: 'Trading Psychology',
      mentions: 189,
      relatedStrategies: ['All Strategies']
    },
    {
      id: '6',
      name: 'Position Sizing',
      category: 'Risk Management',
      mentions: 143,
      relatedStrategies: ['All Strategies']
    },
    {
      id: '7',
      name: 'Market Structure',
      category: 'Technical Analysis',
      mentions: 176,
      relatedStrategies: ['Trend Continuation', 'HTF Combo']
    },
    {
      id: '8',
      name: 'Probability Thinking',
      category: 'Trading Psychology',
      mentions: 92,
      relatedStrategies: ['All Strategies']
    }
  ],
  correlations: [
    {
      concept1: 'Order Blocks',
      concept2: 'Liquidity Pools',
      strength: 0.87,
      description: 'Order blocks frequently form near liquidity pools where institutional orders accumulate before major moves.'
    },
    {
      concept1: 'Fair Value Gaps',
      concept2: 'Market Structure',
      strength: 0.79,
      description: 'FVGs often occur during structure breaks and serve as high-probability retest zones for continuation trades.'
    },
    {
      concept1: 'Risk Management',
      concept2: 'Emotional Discipline',
      strength: 0.92,
      description: 'Proper risk management is the foundation of emotional discipline, allowing traders to execute without fear or greed.'
    },
    {
      concept1: 'Position Sizing',
      concept2: 'Probability Thinking',
      strength: 0.85,
      description: 'Optimal position sizing depends on understanding probability distributions and expected value of trading systems.'
    }
  ]
};
