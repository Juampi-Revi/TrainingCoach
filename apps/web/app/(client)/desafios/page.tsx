"use client";

import { useChallenges } from "@/lib/hooks/use-challenges";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast";

export default function DesafiosPage() {
  const { challenges, history, isLoading, joinChallenge } = useChallenges();
  const toast = useToast();

  const handleJoin = async (challengeId: string, title: string) => {
    try {
      await joinChallenge(challengeId);
      toast.success(`Te uniste a "${title}"`);
    } catch (err) {
      toast.error("Error al unirte al desafío");
    }
  };

  if (isLoading) {
    return <DesafiosSkeleton />;
  }

  return (
    <div className="desafios-page">
      <header className="desafios-header">
        <h1>Desafíos</h1>
        <p className="subtitle">Competí contra vos mismo y otros atletas</p>
      </header>

      {/* Active Challenges */}
      <section className="challenges-section">
        <h2>Desafíos Activos</h2>
        
        {challenges.filter(c => !c.progress?.completed).length === 0 ? (
          <div className="empty-state">
            <p>No hay desafíos activos</p>
            <p className="hint">Mirá los desafíos disponibles y unite a uno</p>
          </div>
        ) : (
          <div className="challenges-grid">
            {challenges
              .filter(c => !c.progress?.completed)
              .map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onJoin={() => handleJoin(challenge.id, challenge.title)}
                />
              ))}
          </div>
        )}
      </section>

      {/* Joined & In Progress */}
      {challenges.some(c => c.joined && !c.progress?.completed) && (
        <section className="challenges-section">
          <h2>Tu Progreso</h2>
          <div className="challenges-grid">
            {challenges
              .filter(c => c.joined && !c.progress?.completed)
              .map((challenge) => (
                <ChallengeProgressCard key={challenge.id} challenge={challenge} />
              ))}
          </div>
        </section>
      )}

      {/* Completed Challenges */}
      {history.length > 0 && (
        <section className="challenges-section completed">
          <h2>Completados</h2>
          <div className="challenges-list">
            {history.slice(0, 5).map((challenge) => (
              <CompletedChallengeRow key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

interface ChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    description: string | null;
    targetValue: number;
    unit: string;
    xpReward: number;
    participantCount: number;
    joined: boolean;
  };
  onJoin: () => void;
}

function ChallengeCard({ challenge, onJoin }: ChallengeCardProps) {
  return (
    <div className="challenge-card">
      <div className="challenge-header">
        <h3>{challenge.title}</h3>
        <span className="xp-reward">+{challenge.xpReward} XP</span>
      </div>
      
      {challenge.description && (
        <p className="challenge-description">{challenge.description}</p>
      )}
      
      <div className="challenge-meta">
        <span>Meta: {challenge.targetValue} {challenge.unit}</span>
        <span>{challenge.participantCount} participantes</span>
      </div>
      
      {!challenge.joined && (
        <Button onClick={onJoin} variant="primary" size="sm">
          Unirse
        </Button>
      )}
    </div>
  );
}

function ChallengeProgressCard({ challenge }: { challenge: { title: string; progress?: { currentValue: number; targetValue: number; percentComplete: number } | null } }) {
  const progress = challenge.progress;
  if (!progress) return null;

  return (
    <div className="challenge-card progress">
      <h3>{challenge.title}</h3>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress.percentComplete}%` }}
        />
      </div>
      <div className="progress-text">
        {progress.currentValue} / {progress.targetValue}
        <span>{Math.round(progress.percentComplete)}%</span>
      </div>
    </div>
  );
}

function CompletedChallengeRow({ challenge }: { challenge: { title: string; xpReward: number; rank?: number } }) {
  return (
    <div className="completed-challenge">
      <span className="title">{challenge.title}</span>
      {challenge.rank && <span className="rank">#{challenge.rank}</span>}
      <span className="xp">+{challenge.xpReward} XP</span>
    </div>
  );
}

function DesafiosSkeleton() {
  return (
    <div className="desafios-page">
      <header className="desafios-header">
        <Skeleton width={150} height={32} />
        <Skeleton width={250} height={20} />
      </header>
      
      <section className="challenges-section">
        <Skeleton width={200} height={24} />
        <div className="challenges-grid">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={150} />
          ))}
        </div>
      </section>
    </div>
  );
}
