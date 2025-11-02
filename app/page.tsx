import { MatchDetails } from "@/components/match-details/match-details"

export default function Home() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Detalles de la Partida</h1>
      <MatchDetails
        matchId="match-123"
        finalScore={{ team1: 13, team2: 10 }}
        totalKills={45}
        goodPlays={12}
        badPlays={3}
      />
    </main>
  )
}
