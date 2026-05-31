"use client";

import { useBadges } from "@/lib/hooks/use-badges";
import { useStreaks } from "@/lib/hooks/use-streaks";
import { useXp } from "@/lib/hooks/use-xp";
import { useFriends } from "@/lib/hooks/use-friends";
import { BadgeCard } from "./badge-card";
import { StreakDisplay } from "./streak-display";
import { XpBar } from "./xp-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export function AchievementsContent() {
  const { badges, stats: badgeStats, loading: badgesLoading } = useBadges();
  const { stats: streakStats, isLoading: streakLoading } = useStreaks();
  const { stats: xpStats, isLoading: xpLoading } = useXp();
  const { friends, counts, isLoading: friendsLoading } = useFriends();

  const isLoading = badgesLoading || streakLoading || xpLoading || friendsLoading;

  if (isLoading) {
    return <AchievementsSkeleton />;
  }

  const unlockedBadges = badges.filter((b) => b.unlockedAt);
  const lockedBadges = badges.filter((b) => !b.unlockedAt);

  return (
    <div className="achievements-page">
      <header className="achievements-header">
        <h1>Tus Logros</h1>
        <p className="subtitle">Seguí tu progreso y desbloqueá nuevos retos</p>
      </header>

      {/* Stats Overview */}
      <section className="stats-overview">
        {xpStats && <XpBar stats={xpStats} />}
        {streakStats && <StreakDisplay stats={streakStats} />}
      </section>

      {/* Friends Section */}
      <section className="friends-section">
        <div className="section-header">
          <h2>Amigos</h2>
          <Link href="/clasificacion">
            <Button variant="secondary" size="sm">
              Ver Clasificación
            </Button>
          </Link>
        </div>
        
        <div className="friends-stats">
          <div className="friend-stat">
            <span className="stat-value">{counts.following}</span>
            <span className="stat-label">Siguiendo</span>
          </div>
          <div className="friend-stat">
            <span className="stat-value">{counts.followers}</span>
            <span className="stat-label">Seguidores</span>
          </div>
        </div>

        {friends.length > 0 && (
          <div className="friends-avatars">
            {friends.slice(0, 5).map((friend) => (
              <div key={friend.userId} className="friend-avatar" title={friend.name}>
                {friend.avatarUrl ? (
                  <Image src={friend.avatarUrl} alt={friend.name} width={32} height={32} unoptimized />
                ) : (
                  <span>{friend.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
            ))}
            {friends.length > 5 && (
              <div className="friend-avatar more">
                <span>+{friends.length - 5}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Badges Section */}
      <section className="badges-section">
        <div className="section-header">
          <h2>Badges Desbloqueados</h2>
          <span className="badge-count">
            {badgeStats?.unlocked ?? 0}/{badgeStats?.total ?? 0}
          </span>
        </div>
        
        {unlockedBadges.length > 0 ? (
          <div className="badges-grid">
            {unlockedBadges.map((badge) => (
              <BadgeCard key={badge.badgeId} badge={badge} unlocked />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Todavía no desbloqueaste ningún badge</p>
            <p className="hint">Completá entrenamientos para ganar tus primeros badges</p>
          </div>
        )}
      </section>

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <section className="badges-section locked">
          <div className="section-header">
            <h2>Badges por Desbloquear</h2>
          </div>
          <div className="badges-grid">
            {lockedBadges.slice(0, 6).map((badge) => (
              <BadgeCard key={badge.badgeId} badge={badge} unlocked={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AchievementsSkeleton() {
  return (
    <div className="achievements-page">
      <header className="achievements-header">
        <Skeleton width={200} height={32} />
        <Skeleton width={300} height={20} />
      </header>

      <section className="stats-overview">
        <Skeleton width="100%" height={120} />
        <Skeleton width="100%" height={100} />
      </section>

      <section className="badges-section">
        <Skeleton width={200} height={28} />
        <div className="badges-grid">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height={150} />
          ))}
        </div>
      </section>
    </div>
  );
}
