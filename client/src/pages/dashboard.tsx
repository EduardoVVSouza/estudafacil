import { useQuery } from "@tanstack/react-query";
import { Calendar, FileText, Clock, Book, Trophy, ChevronRight, Plus, Upload } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDuration, formatTime } from "@/lib/utils";
import type { StudySession } from "@shared/schema";

// Mock user ID for now - in real app this would come from auth
const MOCK_USER_ID = 1;

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/user/${MOCK_USER_ID}/stats`],
  });

  const { data: recentSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: [`/api/user/${MOCK_USER_ID}/sessions`, { limit: 5 }],
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 md:mb-0">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-dark-gray mb-4">
          Seu Sucesso em Concursos Públicos
        </h2>
        <p className="text-lg text-medium-gray max-w-2xl mx-auto">
          Organize seus estudos e maximize seu aprendizado com nossas ferramentas inteligentes
        </p>
      </div>

      {/* Main Features Grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Study Schedule Card */}
        <Card className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
          <div className="bg-gradient-to-br from-primary-orange to-secondary-orange p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Calendar className="text-white text-xl" />
              </div>
              <div className="text-white text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                Planejamento
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Cronograma de Estudos</h3>
            <p className="text-white text-opacity-90">
              Crie e gerencie seu plano de estudos personalizado
            </p>
          </div>
          <CardContent className="p-6">
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-medium-gray">
                <div className="w-2 h-2 bg-primary-orange rounded-full mr-3"></div>
                <span>Planejamento automático por disciplinas</span>
              </div>
              <div className="flex items-center text-medium-gray">
                <div className="w-2 h-2 bg-primary-orange rounded-full mr-3"></div>
                <span>Acompanhamento de progresso</span>
              </div>
              <div className="flex items-center text-medium-gray">
                <div className="w-2 h-2 bg-primary-orange rounded-full mr-3"></div>
                <span>Lembretes e notificações</span>
              </div>
            </div>
            <Link href="/schedule">
              <Button className="w-full bg-primary-orange hover:bg-secondary-orange text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center">
                <Plus className="w-4 h-4 mr-2" />
                Criar Cronograma
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* PDF Reader Card */}
        <Card className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
          <div className="bg-gradient-to-br from-accent-orange to-primary-orange p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <FileText className="text-white text-xl" />
              </div>
              <div className="text-white text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                Áudio
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Leitor PDF com Voz</h3>
            <p className="text-white text-opacity-90">
              Transforme seus PDFs em audiobooks personalizados
            </p>
          </div>
          <CardContent className="p-6">
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-medium-gray">
                <div className="w-2 h-2 bg-primary-orange rounded-full mr-3"></div>
                <span>Conversão de texto para áudio</span>
              </div>
              <div className="flex items-center text-medium-gray">
                <div className="w-2 h-2 bg-primary-orange rounded-full mr-3"></div>
                <span>Controle de velocidade e tom</span>
              </div>
              <div className="flex items-center text-medium-gray">
                <div className="w-2 h-2 bg-primary-orange rounded-full mr-3"></div>
                <span>Marcação de páginas importantes</span>
              </div>
            </div>
            <Link href="/pdf-reader">
              <Button className="w-full bg-primary-orange hover:bg-secondary-orange text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center">
                <Upload className="w-4 h-4 mr-2" />
                Carregar PDF
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Stats Section */}
      <Card className="bg-white rounded-2xl shadow-lg p-8 mb-12">
        <h3 className="text-2xl font-bold text-dark-gray mb-6 text-center">Seu Progresso</h3>
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-light-orange rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-primary-orange w-8 h-8" />
              </div>
              <div className="text-3xl font-bold text-dark-gray mb-2">
                {stats?.totalHours || 0}
              </div>
              <div className="text-medium-gray">Horas de Estudo</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-light-orange rounded-full flex items-center justify-center mx-auto mb-4">
                <Book className="text-primary-orange w-8 h-8" />
              </div>
              <div className="text-3xl font-bold text-dark-gray mb-2">
                {stats?.completedSessions || 0}
              </div>
              <div className="text-medium-gray">Sessões Concluídas</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-light-orange rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="text-primary-orange w-8 h-8" />
              </div>
              <div className="text-3xl font-bold text-dark-gray mb-2">
                {stats?.currentStreak || 0}
              </div>
              <div className="text-medium-gray">Dias Consecutivos</div>
            </div>
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      <Card className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-dark-gray">Atividade Recente</h3>
          <Button variant="ghost" className="text-primary-orange hover:text-secondary-orange font-medium">
            Ver Todas
          </Button>
        </div>
        {sessionsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center p-4 bg-light-gray rounded-xl">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : recentSessions && recentSessions.length > 0 ? (
          <div className="space-y-4">
            {recentSessions.map((session: StudySession) => (
              <div
                key={session.id}
                className="flex items-center p-4 bg-light-gray rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 bg-primary-orange rounded-full flex items-center justify-center mr-4">
                  <Book className="text-white w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-dark-gray">
                    Estudou {session.subject}
                  </div>
                  <div className="text-sm text-medium-gray">
                    {formatDuration(session.duration)} - {formatTime(session.completedAt)}
                  </div>
                </div>
                <div className="text-primary-orange">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Book className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-medium-gray">Nenhuma atividade recente</p>
            <p className="text-sm text-gray-400 mt-2">
              Comece seus estudos para ver suas atividades aqui
            </p>
          </div>
        )}
      </Card>
    </main>
  );
}
