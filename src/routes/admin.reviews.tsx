import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Star, MessageSquare, CheckCircle, XCircle, Plus, Loader2, Wand2 } from "lucide-react";
import { useAdmin } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateReviewsFn } from "@/lib/reviews.functions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviews,
});

const PAK_CITIES = ["Lahore", "Karachi", "Islamabad", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Rawalpindi"];
const MOCK_NAMES = ["Ayesha", "Maryam", "Fatima", "Hira", "Zainab", "Sana", "Khadija", "Amna", "Bisma", "Ira"];
const POSITIVE_BODIES = [
  "Beautiful fabric and the drape is perfect. Highly recommended!",
  "The quality of the silk is amazing. Best purchase so far.",
  "Very comfortable for daily wear. The color is exactly as shown.",
  "Excellent delivery speed. Product was packed very nicely.",
  "MashaAllah, the namaz chadar is very soft and opaque.",
  "Always happy with Anayah. Premium quality as always.",
];

function AdminReviews() {
  const { products, reload } = useAdmin();
  const generateReviews = useServerFn(generateReviewsFn);
  const [generating, setGenerating] = useState(false);
  const [targetProductId, setTargetProductId] = useState<string>("");
  const [reviewCount, setReviewCount] = useState(1);
  const [manualName, setManualName] = useState("");
  const [manualReview, setManualReview] = useState("");
  const [open, setOpen] = useState(false);

  // Flatten reviews from all products
  const allReviews = products
    .flatMap((p) => (p.reviews || []).map((r) => ({ ...r, productName: p.name, productId: p.id })))
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      const validA = !isNaN(dateA) ? dateA : 0;
      const validB = !isNaN(dateB) ? dateB : 0;
      return validB - validA;
    });

  const handleGenerate = async () => {
    if (!targetProductId) {
      toast.error("Please select a product");
      return;
    }

    setGenerating(true);
    try {
      const names = manualName.includes(",") 
        ? manualName.split(",").map(n => n.trim()).filter(Boolean)
        : [manualName.trim()].filter(Boolean);
      
      const texts = manualReview.includes("|") 
        ? manualReview.split("|").map(t => t.trim()).filter(Boolean)
        : [manualReview.trim()].filter(Boolean);

      const countToGenerate = Math.max(reviewCount, names.length, texts.length);

      const mockReviews = Array.from({ length: countToGenerate }).map((_, idx) => {
        const name = names[idx % names.length] || MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
        const city = PAK_CITIES[Math.floor(Math.random() * PAK_CITIES.length)];
        const body = texts[idx % texts.length] || POSITIVE_BODIES[Math.floor(Math.random() * POSITIVE_BODIES.length)];
        const rating = 5;
        const title = "Verified Purchase";
        
        return {
          name,
          city,
          rating,
          title,
          body,
          date: new Date(Date.now() - Math.random() * 7 * 24 * 3600000).toISOString(),
          verified: true,
          helpful: Math.floor(Math.random() * 5),
        };
      });

      await generateReviews({
        data: {
          productId: targetProductId,
          count: countToGenerate,
          reviews: mockReviews,
        }
      });

      toast.success(`Generated ${countToGenerate} reviews successfully!`);
      setOpen(false);
      setManualName("");
      setManualReview("");
      await reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate reviews");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Product Reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage and generate customer feedback.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Wand2 className="mr-2 size-4" /> Bulk Generate Reviews
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate AI Reviews</DialogTitle>
              <DialogDescription>
                Quickly add social proof to your products by generating realistic reviews.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Select Product</Label>
                <Select value={targetProductId} onValueChange={setTargetProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Customer Names (Separate with commas for multiple)</Label>
                <Input 
                  placeholder="Ayesha, Maryam, Fatima..."
                  value={manualName} 
                  onChange={(e) => setManualName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Review Texts (Separate with | for multiple)</Label>
                <Input 
                  placeholder="Quality is Good | Loved the fabric | Amazing drape"
                  value={manualReview} 
                  onChange={(e) => setManualReview(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Number of Reviews (Max 50)</Label>
                <Input 
                  type="number" 
                  value={reviewCount} 
                  onChange={(e) => setReviewCount(Number(e.target.value))}
                  min={1}
                  max={50}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={generating || !targetProductId}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Generating...
                  </>
                ) : (
                  "Generate Now"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {allReviews.map((r, i) => (
          <div key={`${r.id}-${i}`} className="premium-card p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex text-yellow-500">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`size-3 ${j < r.rating ? "fill-current" : ""}`} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-full truncate max-w-[150px]">
                    {r.productName}
                  </span>
                </div>
                <h3 className="font-display font-bold text-base">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
              </div>
              <div className="flex flex-row items-center justify-between border-t border-border pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0 sm:text-right">
                <div className="text-left sm:text-right">
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {r.city} · {r.date && !isNaN(new Date(r.date).getTime()) ? format(new Date(r.date), "MMM d, yyyy") : "No Date"}
                  </p>
                </div>
                {r.verified && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-green-600 sm:mt-1">
                    <CheckCircle className="size-2.5" /> Verified
                  </span>
                )}
              </div>
            </div>

            {r.adminReply && (
              <div className="mt-4 rounded-xl bg-secondary/30 p-3 text-sm italic">
                <span className="font-semibold not-italic">Anayah Store:</span> {r.adminReply}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 h-9 text-xs sm:flex-none">
                <MessageSquare className="mr-2 size-3.5" /> Reply
              </Button>
              <Button size="sm" variant="ghost" className="flex-1 h-9 text-xs text-destructive sm:flex-none">
                <XCircle className="mr-2 size-3.5" /> Hide
              </Button>
            </div>
          </div>
        ))}

        {allReviews.length === 0 && (
          <div className="premium-card p-12 text-center text-muted-foreground">
            No reviews found. Click "Bulk Generate" to add some!
          </div>
        )}
      </div>
    </div>
  );
}
