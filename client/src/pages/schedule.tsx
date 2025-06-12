import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, Plus, Edit, Trash2, BookOpen, Brain, Upload, FileText, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import type { StudySchedule } from "@shared/schema";

// Mock user ID
const MOCK_USER_ID = 1;

const scheduleSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  subjects: z.string().min(1, "Adicione pelo menos uma matéria"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().min(1, "Data de fim é obrigatória"),
  hoursPerDay: z.number().min(1, "Mínimo 1 hora por dia").max(24, "Máximo 24 horas por dia"),
});

const aiScheduleSchema = z.object({
  examDate: z.string().min(1, "Data do concurso é obrigatória"),
  title: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;
type AiScheduleFormData = z.infer<typeof aiScheduleSchema>;

export default function Schedule() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: schedules, isLoading } = useQuery({
    queryKey: [`/api/user/${MOCK_USER_ID}/schedules`],
  });

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      title: "",
      description: "",
      subjects: "",
      startDate: "",
      endDate: "",
      hoursPerDay: 2,
    },
  });

  const aiForm = useForm<AiScheduleFormData>({
    resolver: zodResolver(aiScheduleSchema),
    defaultValues: {
      examDate: "",
      title: "",
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      const scheduleData = {
        ...data,
        subjects: data.subjects.split(",").map(s => s.trim()).filter(s => s.length > 0),
        hoursPerDay: Number(data.hoursPerDay),
      };
      
      const response = await apiRequest("POST", `/api/user/${MOCK_USER_ID}/schedules`, scheduleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${MOCK_USER_ID}/schedules`] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso!",
        description: "Cronograma criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar cronograma. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const createAiScheduleMutation = useMutation({
    mutationFn: async (data: { examDate: string; title?: string; file: File }) => {
      const formData = new FormData();
      formData.append("editalPdf", data.file);
      formData.append("examDate", data.examDate);
      if (data.title) {
        formData.append("title", data.title);
      }

      const response = await fetch(`/api/user/${MOCK_USER_ID}/schedules/ai-generate`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao gerar cronograma");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${MOCK_USER_ID}/schedules`] });
      setIsAiDialogOpen(false);
      aiForm.reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({
        title: "Cronograma criado com IA!",
        description: `Cronograma gerado para ${data.analysis.daysUntilExam} dias de estudo com ${data.analysis.subjects.length} matérias.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na geração por IA",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${MOCK_USER_ID}/schedules`] });
      toast({
        title: "Sucesso!",
        description: "Cronograma excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir cronograma. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ScheduleFormData) => {
    createScheduleMutation.mutate(data);
  };

  const onAiSubmit = (data: AiScheduleFormData) => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o PDF do edital.",
        variant: "destructive",
      });
      return;
    }

    if (file.type !== "application/pdf") {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos PDF.",
        variant: "destructive",
      });
      return;
    }

    createAiScheduleMutation.mutate({
      examDate: data.examDate,
      title: data.title,
      file,
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este cronograma?")) {
      deleteScheduleMutation.mutate(id);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 md:mb-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-dark-gray mb-2">Cronogramas de Estudo</h1>
          <p className="text-medium-gray">
            Organize seus estudos e mantenha-se focado em seus objetivos
          </p>
        </div>

        <div className="flex space-x-3">
          <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                <Brain className="w-4 h-4 mr-2" />
                Criar com IA
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                  Cronograma Inteligente
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2">Como funciona:</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Envie o PDF do edital do seu concurso</li>
                    <li>• Informe a data da prova</li>
                    <li>• A IA analisará as matérias e criará seu cronograma</li>
                  </ul>
                </div>
                
                <Form {...aiForm}>
                  <form onSubmit={aiForm.handleSubmit(onAiSubmit)} className="space-y-4">
                    <FormField
                      control={aiForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Concurso TRT 2024" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={aiForm.control}
                      name="examDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data do Concurso</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="editalPdf">PDF do Edital</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-orange transition-colors">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Update UI to show selected file
                            }
                          }}
                        />
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-primary-orange hover:text-secondary-orange font-medium"
                        >
                          Clique para selecionar o PDF do edital
                        </button>
                        <p className="text-xs text-gray-500 mt-1">Apenas arquivos PDF são aceitos</p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAiDialogOpen(false);
                          aiForm.reset();
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        disabled={createAiScheduleMutation.isPending}
                      >
                        {createAiScheduleMutation.isPending ? (
                          <div className="flex items-center">
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Analisando...
                          </div>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            Gerar Cronograma
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary-orange hover:bg-secondary-orange text-white">
                <Plus className="w-4 h-4 mr-2" />
                Criar Manual
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Cronograma</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Concurso TRT 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descrição do cronograma..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subjects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matérias</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Direito Civil, Direito Penal, Português"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Fim</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="hoursPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas por Dia</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="24"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      form.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary-orange hover:bg-secondary-orange"
                    disabled={createScheduleMutation.isPending}
                  >
                    {createScheduleMutation.isPending ? "Criando..." : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : schedules && Array.isArray(schedules) && schedules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule: StudySchedule) => (
            <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-dark-gray">
                      {schedule.title}
                    </CardTitle>
                    {schedule.description && (
                      <p className="text-sm text-medium-gray mt-1">
                        {schedule.description}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(schedule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-medium-gray">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                </div>
                
                <div className="flex items-center text-sm text-medium-gray">
                  <Clock className="w-4 h-4 mr-2" />
                  {schedule.hoursPerDay}h por dia
                </div>

                <div>
                  <Label className="text-sm font-medium text-dark-gray mb-2 block">
                    Matérias:
                  </Label>
                  <div className="flex flex-wrap gap-1">
                    {schedule.subjects.map((subject, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full bg-primary-orange hover:bg-secondary-orange text-white"
                  size="sm"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Iniciar Estudo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dark-gray mb-2">
              Nenhum cronograma criado
            </h3>
            <p className="text-medium-gray mb-6">
              Crie seu primeiro cronograma de estudos para começar a se organizar
            </p>
            <Button 
              className="bg-primary-orange hover:bg-secondary-orange text-white"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Cronograma
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
