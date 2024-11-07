"use client"
import dynamic from 'next/dynamic'

const SolarEfficiencySimulator = dynamic(
  () => import('@/components/SolarEfficiencySimulator'),
  { ssr: false }
)

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <SolarEfficiencySimulator />
    </main>
  )
}