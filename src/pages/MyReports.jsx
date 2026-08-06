import React, { useEffect, useState } from "react";
import { FileText, Loader2, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/jobshield/Navbar";
import Footer from "@/components/jobshield/Footer";
import ScanHistoryList from "@/components/jobshield/ScanHistoryList";
import { Button } from "@/components/ui/button";
import { api } from "@/api/supabaseClient";

export default function MyReports() {
  const [scans, setScans] = useState(null);

  useEffect(() => {
    let active = true;
    api.entities.Scan.listMine("-created_date", 200)
      .then((data) => { if (active) setScans(data || []); })
      .catch(() => { if (active) setScans([]); });
    return () => { active = false; };
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight font-heading">My Reports</h1>
                <p className="text-sm text-muted-foreground">Reopen, share, and download saved scan reports.</p>
              </div>
            </div>
            <Button asChild>
              <Link to="/analyzer"><ScanLine className="mr-2 h-4 w-4" />New scan</Link>
            </Button>
          </div>

          <div className="mt-8">
            {!scans ? (
              <p className="text-sm text-muted-foreground">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Loading reports...
              </p>
            ) : (
              <ScanHistoryList scans={scans} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
