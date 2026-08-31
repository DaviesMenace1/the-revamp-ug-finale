'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronRight, ChevronDown, Plus, Trash2, X } from '@/components/ui/luxury-icons'
import {
  createDepartment,
  deleteDepartment,
  createCategory,
  deleteCategory,
  createSubCategory,
  deleteSubCategory,
} from '@/lib/actions/taxonomy'

type Department = { id: string; name: string; slug: string; active: boolean }
type Category = { id: string; departmentId: string; name: string; slug: string; active: boolean }
type SubCategory = {
  id: string
  categoryId: string
  name: string
  slug: string
  active: boolean
  templateId: string | null
}
type Template = { id: string; name: string }

export default function CategoriesClient({
  initialDepartments = [],
  initialCategories = [],
  initialSubCategories = [],
  templates = [],
}: {
  initialDepartments: Department[]
  initialCategories: Category[]
  initialSubCategories: SubCategory[]
  templates: Template[]
}) {
  const [departmentsList, setDepartmentsList] = useState(initialDepartments)
  const [categoriesList, setCategoriesList] = useState(initialCategories)
  const [subCategoriesList, setSubCategoriesList] = useState(initialSubCategories)

  const [expandedDept, setExpandedDept] = useState<string | null>(null)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  const [newDeptName, setNewDeptName] = useState('')
  const [showNewDept, setShowNewDept] = useState(false)

  const [newCatName, setNewCatName] = useState('')
  const [addingCatTo, setAddingCatTo] = useState<string | null>(null)

  const [newSubForm, setNewSubForm] = useState({ name: '', templateId: templates[0]?.id ?? '' })
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()

  function handleCreateDepartment() {
    if (!newDeptName.trim()) return
    startTransition(async () => {
      const res = await createDepartment(newDeptName)
      if (res.success && res.department) {
        setDepartmentsList((prev) => [...prev, res.department as Department])
        setNewDeptName('')
        setShowNewDept(false)
      } else if (res.error) alert(res.error)
    })
  }

  function handleDeleteDepartment(id: string) {
    if (!confirm('Delete this department? Its categories must be moved or deleted first.')) return
    startTransition(async () => {
      const res = await deleteDepartment(id)
      if (res.success) {
        setDepartmentsList((prev) => prev.filter((d) => d.id !== id))
      } else if (res.error) alert(res.error)
    })
  }

  function handleCreateCategory(departmentId: string) {
    if (!newCatName.trim()) return
    startTransition(async () => {
      const res = await createCategory(departmentId, newCatName)
      if (res.success && res.category) {
        setCategoriesList((prev) => [...prev, res.category as Category])
        setNewCatName('')
        setAddingCatTo(null)
      } else if (res.error) alert(res.error)
    })
  }

  function handleDeleteCategory(id: string) {
    if (!confirm('Delete this category? Its subcategories must be moved or deleted first.')) return
    startTransition(async () => {
      const res = await deleteCategory(id)
      if (res.success) {
        setCategoriesList((prev) => prev.filter((c) => c.id !== id))
      } else if (res.error) alert(res.error)
    })
  }

  function handleCreateSubCategory(categoryId: string) {
    if (!newSubForm.name.trim() || !newSubForm.templateId) return
    startTransition(async () => {
      const res = await createSubCategory(categoryId, newSubForm.name, newSubForm.templateId)
      if (res.success && res.subCategory) {
        setSubCategoriesList((prev) => [...prev, res.subCategory as SubCategory])
        setNewSubForm({ name: '', templateId: templates[0]?.id ?? '' })
        setAddingSubTo(null)
      } else if (res.error) alert(res.error)
    })
  }

  function handleDeleteSubCategory(id: string) {
    if (!confirm('Delete this subcategory? Products using it may be affected.')) return
    startTransition(async () => {
      const res = await deleteSubCategory(id)
      if (res.success) {
        setSubCategoriesList((prev) => prev.filter((s) => s.id !== id))
      } else if (res.error) alert(res.error)
    })
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-light text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-2">
            Department → Category → Subcategory taxonomy. Each subcategory drives the product
            form template admins see when creating a product.
          </p>
        </div>
        <Button onClick={() => setShowNewDept(true)} className="rounded-none">
          <Plus className="w-4 h-4 mr-2" />
          Department
        </Button>
      </div>

      {showNewDept && (
        <div className="flex items-center gap-2 rounded-lg border border-border/20 p-4">
          <Input
            placeholder="Department name"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            className="rounded-none"
          />
          <Button disabled={isPending} onClick={handleCreateDepartment} className="rounded-none">
            Create
          </Button>
          <button onClick={() => setShowNewDept(false)}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      <div className="space-y-2">
        {departmentsList.map((department) => {
          const deptCategories = categoriesList.filter((c) => c.departmentId === department.id)
          const isExpanded = expandedDept === department.id

          return (
            <div key={department.id} className="rounded-lg border border-border/20">
              <div className="flex items-center justify-between p-4">
                <button
                  onClick={() => setExpandedDept(isExpanded ? null : department.id)}
                  className="flex items-center gap-2 text-sm font-medium text-foreground"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {department.name}
                  <span className="text-xs text-muted-foreground">({deptCategories.length} categories)</span>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAddingCatTo(department.id)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    + Category
                  </button>
                  <button onClick={() => handleDeleteDepartment(department.id)}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {addingCatTo === department.id && (
                <div className="flex items-center gap-2 border-t border-border/20 p-3 pl-10">
                  <Input
                    placeholder="Category name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="rounded-none h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleCreateCategory(department.id)}
                    className="rounded-none"
                  >
                    Add
                  </Button>
                  <button onClick={() => setAddingCatTo(null)}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}

              {isExpanded && (
                <div className="space-y-1 border-t border-border/20 p-3 pl-8">
                  {deptCategories.map((category) => {
                    const catSubCategories = subCategoriesList.filter((s) => s.categoryId === category.id)
                    const isCatExpanded = expandedCat === category.id

                    return (
                      <div key={category.id} className="rounded border border-border/10">
                        <div className="flex items-center justify-between p-2.5">
                          <button
                            onClick={() => setExpandedCat(isCatExpanded ? null : category.id)}
                            className="flex items-center gap-2 text-sm text-foreground"
                          >
                            {isCatExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                            {category.name}
                            <span className="text-xs text-muted-foreground">
                              ({catSubCategories.length})
                            </span>
                          </button>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setAddingSubTo(category.id)}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              + Subcategory
                            </button>
                            <button onClick={() => handleDeleteCategory(category.id)}>
                              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        </div>

                        {addingSubTo === category.id && (
                          <div className="flex items-center gap-2 border-t border-border/10 p-2.5 pl-8">
                            <Input
                              placeholder="Subcategory name"
                              value={newSubForm.name}
                              onChange={(e) => setNewSubForm((f) => ({ ...f, name: e.target.value }))}
                              className="rounded-none h-8 text-xs"
                            />
                            <select
                              value={newSubForm.templateId}
                              onChange={(e) => setNewSubForm((f) => ({ ...f, templateId: e.target.value }))}
                              className="rounded border border-muted bg-transparent px-2 py-1 text-xs"
                            >
                              {templates.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleCreateSubCategory(category.id)}
                              className="rounded-none"
                            >
                              Add
                            </Button>
                            <button onClick={() => setAddingSubTo(null)}>
                              <X className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        )}

                        {isCatExpanded && (
                          <div className="space-y-1 border-t border-border/10 p-2 pl-8">
                            {catSubCategories.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between rounded px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/50"
                              >
                                <span>{sub.name}</span>
                                <button onClick={() => handleDeleteSubCategory(sub.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {catSubCategories.length === 0 && (
                              <p className="px-2 py-1.5 text-xs text-muted-foreground">No subcategories yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {deptCategories.length === 0 && (
                    <p className="p-2 text-xs text-muted-foreground">No categories yet.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
                            }
