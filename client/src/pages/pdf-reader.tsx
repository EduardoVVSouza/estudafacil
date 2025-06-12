import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Upload, Play, Pause, SkipForward, SkipBack, Volume2, FileText, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import type { PdfDocument } from "@shared/schema";

// Mock user ID
const MOCK_USER_ID = 1;

export default function PDFReader() {
  const [selectedPdf, setSelectedPdf] = useState<PdfDocument | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState([1]);
  const [currentText, setCurrentText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechSynthesis = window.speechSynthesis;
  const { toast } = useToast();

  const { data: pdfs, isLoading } = useQuery({
    queryKey: [`/api/user/${MOCK_USER_ID}/pdfs`],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/user/${MOCK_USER_ID}/pdfs`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload PDF");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${MOCK_USER_ID}/pdfs`] });
      toast({
        title: "Sucesso!",
        description: "PDF enviado com sucesso.",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao enviar PDF. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/pdfs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${MOCK_USER_ID}/pdfs`] });
      if (selectedPdf) {
        setSelectedPdf(null);
        stopSpeech();
      }
      toast({
        title: "Sucesso!",
        description: "PDF excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir PDF. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos PDF.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("title", file.name.replace(".pdf", ""));

    uploadMutation.mutate(formData);
  };

  const handlePdfSelect = (pdf: PdfDocument) => {
    setSelectedPdf(pdf);
    // In a real implementation, you would load the PDF content here
    // For now, we'll use sample text
    setCurrentText(`Este é um texto de exemplo do PDF "${pdf.title}". Em uma implementação real, o conteúdo do PDF seria extraído e exibido aqui. O sistema de text-to-speech pode então ler este conteúdo em voz alta com diferentes velocidades e configurações.`);
    stopSpeech();
  };

  const startSpeech = () => {
    if (!currentText) return;

    stopSpeech();

    const utterance = new SpeechSynthesisUtterance(currentText);
    utterance.rate = speechRate[0];
    utterance.lang = 'pt-BR';
    
    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      toast({
        title: "Erro",
        description: "Erro na síntese de voz. Verifique se seu navegador suporta esta funcionalidade.",
        variant: "destructive",
      });
    };

    speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const stopSpeech = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const toggleSpeech = () => {
    if (isPlaying) {
      stopSpeech();
    } else {
      startSpeech();
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este PDF?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 md:mb-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-gray mb-2">Leitor PDF com Voz</h1>
        <p className="text-medium-gray">
          Transforme seus PDFs em audiobooks personalizados
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* PDF Library */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Minha Biblioteca
                <Button
                  size="sm"
                  className="bg-primary-orange hover:bg-secondary-orange"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadMutation.isPending ? "Enviando..." : "Enviar"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : pdfs && pdfs.length > 0 ? (
                <div className="space-y-3">
                  {pdfs.map((pdf: PdfDocument) => (
                    <div
                      key={pdf.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPdf?.id === pdf.id
                          ? "border-primary-orange bg-light-orange"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handlePdfSelect(pdf)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-1">
                            <FileText className="w-4 h-4 text-primary-orange mr-2 flex-shrink-0" />
                            <h3 className="font-medium text-sm text-dark-gray truncate">
                              {pdf.title}
                            </h3>
                          </div>
                          <p className="text-xs text-medium-gray">
                            {formatDate(pdf.uploadedAt)}
                          </p>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePdfSelect(pdf);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(pdf.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-medium-gray mb-4">Nenhum PDF enviado</p>
                  <Button
                    size="sm"
                    className="bg-primary-orange hover:bg-secondary-orange"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar Primeiro PDF
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* PDF Reader and Audio Controls */}
        <div className="lg:col-span-2">
          {selectedPdf ? (
            <div className="space-y-6">
              {/* PDF Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{selectedPdf.title}</CardTitle>
                      <p className="text-medium-gray">
                        Enviado em {formatDate(selectedPdf.uploadedAt)}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      Página {selectedPdf.lastReadPage || 1}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Audio Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Volume2 className="w-5 h-5 mr-2" />
                    Controles de Áudio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Play Controls */}
                  <div className="flex items-center justify-center space-x-4">
                    <Button variant="outline" size="sm">
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                      size="lg"
                      className="bg-primary-orange hover:bg-secondary-orange"
                      onClick={toggleSpeech}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6" />
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Speed Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Velocidade</label>
                      <span className="text-sm text-medium-gray">{speechRate[0]}x</span>
                    </div>
                    <Slider
                      value={speechRate}
                      onValueChange={setSpeechRate}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* PDF Content Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Conteúdo do PDF</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg min-h-[200px]">
                    <p className="text-dark-gray leading-relaxed">
                      {currentText}
                    </p>
                  </div>
                  
                  {/* Reading Progress */}
                  <div className="mt-4 flex items-center justify-between text-sm text-medium-gray">
                    <span>Progresso da leitura</span>
                    <span>15% concluído</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-primary-orange h-2 rounded-full" style={{ width: "15%" }}></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-dark-gray mb-2">
                  Selecione um PDF
                </h3>
                <p className="text-medium-gray">
                  Escolha um PDF da sua biblioteca para começar a leitura com voz
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
