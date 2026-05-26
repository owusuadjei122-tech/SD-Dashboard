"use client";

import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { AddProductModal } from "@/components/modules/wear/AddProductModal";

// Since it's a client component, we need to pass products as props
export default function WearClientPage({ initialProducts }: { initialProducts: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {isModalOpen && <AddProductModal onClose={() => setIsModalOpen(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SelfDiscoveryWear</h1>
          <p className="text-muted-foreground mt-1">Manage your fashion products and inventory.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search products, SKUs..." 
            className="w-full h-10 bg-secondary/50 border border-border rounded-md pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm font-medium hover:bg-secondary/50 transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-6 gap-4 p-4 border-b border-border font-medium text-sm text-muted-foreground bg-secondary/20">
          <div className="col-span-2">Product Name</div>
          <div>Description</div>
          <div>Price</div>
          <div>Status</div>
          <div>Created</div>
        </div>
        
        {initialProducts && initialProducts.length > 0 ? (
          initialProducts.map((item: any) => (
            <div key={item.id} className="grid grid-cols-6 gap-4 p-4 border-b border-border last:border-0 text-sm items-center hover:bg-secondary/20 transition-colors">
              <div className="col-span-2 font-medium flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary rounded-md border border-border flex shrink-0" />
                {item.name}
              </div>
              <div className="text-muted-foreground truncate">{item.description}</div>
              <div className="font-medium">${item.price}</div>
              <div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {item.status}
                </span>
              </div>
              <div className="text-muted-foreground">
                {new Date(item.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No products found. Click "Add Product" to create one.
          </div>
        )}
      </div>
    </div>
  );
}
