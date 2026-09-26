function App() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="rounded-2xl bg-surface border border-border p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-primary">
          AeroTrack
        </h1>

        <p className="mt-2 text-text-secondary">
          Global flights. Real-time insights.
        </p>

       <Button>Search Flight</Button>

<Button variant="secondary">
  Featured Route
</Button>

<Button variant="tertiary">
  View Details
</Button>

<Button variant="outline">
  Filter
</Button>

<Button variant="ghost">
  Cancel
</Button>
      </div>
    </div>
  )
}

export default App