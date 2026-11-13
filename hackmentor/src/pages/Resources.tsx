import { useState, useEffect } from "react";
import { Search, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState, Spinner } from "../components/ui/Feedback";

import { useResources } from "../hooks/useResources";
import type { ResourceCategory } from "../types";

const categories: ResourceCategory[] = [
  "Datasets",
  "APIs",
  "Documentation",
  "Libraries",
  "Tutorials",
  "Research Papers",
  "Similar Projects",
  "Tools",
];

export function ResourcesPage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<ResourceCategory | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCat, setSearchCat] = useState<ResourceCategory | "All">("All");
  const { resources, loading, error, loadMore, hasMore } = useResources(searchQuery, searchCat);

  const handleSearch = () => {
    setSearchQuery(query.trim());
    setSearchCat(cat);
  };

  return (
    <div className="page">
      <div className="page-head flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="serif text-3xl md:text-4xl text-white">Curated Resources</h1>
          <p className="text-white/70 text-sm mt-1">
            Discover datasets, public APIs, libraries, and design tools to accelerate your prototype.
          </p>
        </div>
        <Button type="button" onClick={handleSearch} disabled={loading} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white">
          {loading ? <Spinner /> : <Sparkles size={15} />} Find Resources
        </Button>
      </div>

      <div className="field mb-4">
        <label className="text-xs font-semibold text-white/70 mb-1.5 block">Search Keywords</label>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3.5 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search datasets, TensorFlow, weather APIs, computer vision..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 text-white text-sm outline-none transition-colors"
          />
        </div>
      </div>

      <div className="chip-row flex flex-wrap gap-2 mb-6">
        <button
          className={`chip px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            cat === "All"
              ? "bg-purple-600 border-purple-500 text-white"
              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
          type="button"
          onClick={() => setCat("All")}
        >
          All Categories
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={`chip px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              cat === c
                ? "bg-purple-600 border-purple-500 text-white"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
            type="button"
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {resources.length === 0 && !loading && !error ? (
        <EmptyState
          title="No resources found"
          body="Try adjusting your search terms or filter category to discover relevant tools and datasets."
        />
      ) : (
        <div className="grid grid-2">
          {resources.map((r) => (
            <Card key={r.id} className="liquid-glass-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-base font-semibold text-white tracking-tight">{r.name}</h3>
                  <Badge tone="focus">{r.category}</Badge>
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-3">
                  {r.description}
                </p>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-white/80 mb-4">
                  <strong className="text-purple-300 block mb-0.5">Why this helps:</strong>
                  {r.whyUseful}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-white/50">
                <span>Source: {r.source}</span>
                <a href={r.url} target="_blank" rel="noreferrer">
                  <Button variant="soft" className="text-xs py-1 px-3 flex items-center gap-1.5">
                    Open Resource <ExternalLink size={12} />
                  </Button>
                </a>
              </div>
            </Card>
          ))}
          {loading && <Spinner />}
          {error && <div className="text-red-400 mt-2">Error: {error}</div>}
          {hasMore && !loading && (
            <button onClick={loadMore} className="btn-primary mt-4">Load More</button>
          )}
        </div>
      )}
    </div>
  );
}
