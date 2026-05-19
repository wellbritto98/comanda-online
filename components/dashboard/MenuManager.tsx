"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { CategoryForm } from "./CategoryForm";
import { ItemForm } from "./ItemForm";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Category {
  id: number;
  name: string;
  sortOrder: number;
}

interface MenuItem {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  active: boolean;
  categoryIds: number[];
}

interface MenuManagerProps {
  categories: Category[];
  items: MenuItem[];
}

export function MenuManager({ categories: initialCategories, items: initialItems }: MenuManagerProps) {
  const router = useRouter();
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [itemDialog, setItemDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>();

  function refresh() {
    router.refresh();
  }

  async function deleteCategory(id: number) {
    if (!confirm("Excluir esta categoria?")) return;
    await fetch(`/api/menu/categories?id=${id}`, { method: "DELETE" });
    refresh();
  }

  async function deleteItem(id: number) {
    if (!confirm("Excluir este item?")) return;
    await fetch(`/api/menu/items?id=${id}`, { method: "DELETE" });
    refresh();
  }

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      cents / 100,
    );

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Categorias</h2>
          <Button
            onClick={() => {
              setEditingCategory(undefined);
              setCategoryDialog(true);
            }}
            className="rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova categoria
          </Button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialCategories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>{cat.sortOrder}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryDialog(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteCategory(cat.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Itens</h2>
          <Button
            onClick={() => {
              setEditingItem(undefined);
              setItemDialog(true);
            }}
            className="gap-2 rounded-xl"
            disabled={initialCategories.length === 0}
          >
            <Plus className="h-4 w-4" />
            Novo item
          </Button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{formatPrice(item.price)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        item.active
                          ? "text-[var(--color-success)]"
                          : "text-muted-foreground"
                      }
                    >
                      {item.active ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditingItem(item);
                          setItemDialog(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <CategoryForm
        open={categoryDialog}
        onOpenChange={setCategoryDialog}
        initial={editingCategory}
        onSuccess={refresh}
      />
      <ItemForm
        open={itemDialog}
        onOpenChange={setItemDialog}
        categories={initialCategories}
        initial={editingItem}
        onSuccess={refresh}
      />
    </div>
  );
}
