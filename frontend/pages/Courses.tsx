import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, BookOpen, CheckCircle, XCircle, Package, Upload, Play, Square } from "lucide-react";
import backend from "~backend/client";
import type { CreateCourseRequest, Course } from "~backend/courses/create";
import type { AddItemsRequest, CourseItemRequest } from "~backend/courses/add_items";

export default function Courses() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [itemsList, setItemsList] = useState<CourseItemRequest[]>([{ itemName: "", requiredQuantity: 1 }]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: () => backend.courses.list(),
  });

  const { data: courseDetails } = useQuery({
    queryKey: ["course", selectedCourse?.id],
    queryFn: () => selectedCourse ? backend.courses.getCourse({ id: selectedCourse.id }) : null,
    enabled: !!selectedCourse,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCourseRequest) => backend.courses.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Course created successfully" });
    },
    onError: (error) => {
      console.error("Error creating course:", error);
      toast({ title: "Error creating course", variant: "destructive" });
    },
  });

  const addItemsMutation = useMutation({
    mutationFn: (data: AddItemsRequest) => backend.courses.addItems(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["course", selectedCourse?.id] });
      setIsItemsDialogOpen(false);
      setItemsList([{ itemName: "", requiredQuantity: 1 }]);
      toast({ 
        title: "Items added successfully",
        description: `${result.summary.sufficientItems} sufficient, ${result.summary.insufficientItems} insufficient`
      });
    },
    onError: (error) => {
      console.error("Error adding items:", error);
      toast({ title: "Error adding items", variant: "destructive" });
    },
  });

  const reserveMutation = useMutation({
    mutationFn: (courseId: number) => backend.courses.reserveItems({ courseId }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", selectedCourse?.id] });
      if (result.success) {
        toast({ title: `Successfully reserved ${result.reservedItems} items` });
      } else {
        toast({ 
          title: "Partial reservation completed",
          description: `${result.reservedItems} items reserved, ${result.failedItems.length} failed`,
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error("Error reserving items:", error);
      toast({ title: "Error reserving items", variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ courseId, returnItems }: { courseId: number; returnItems: boolean }) => 
      backend.courses.completeCourse({ courseId, returnItems }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", selectedCourse?.id] });
      toast({ 
        title: "Course completed successfully",
        description: `${result.returnedItems} items returned, ${result.deductedItems} items deducted`
      });
    },
    onError: (error) => {
      console.error("Error completing course:", error);
      toast({ title: "Error completing course", variant: "destructive" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ courseId, file }: { courseId: number; file: File }) => {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      return backend.courses.uploadFile({
        courseId,
        fileName: file.name,
        fileType: file.type,
        fileData: base64,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", selectedCourse?.id] });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      toast({ title: "File uploaded successfully" });
    },
    onError: (error) => {
      console.error("Error uploading file:", error);
      toast({ title: "Error uploading file", variant: "destructive" });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: CreateCourseRequest = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      instructor: formData.get("instructor") as string || undefined,
      studentCount: formData.get("studentCount") ? Number(formData.get("studentCount")) : undefined,
      startDate: formData.get("startDate") ? new Date(formData.get("startDate") as string) : undefined,
      endDate: formData.get("endDate") ? new Date(formData.get("endDate") as string) : undefined,
    };

    createMutation.mutate(data);
  };

  const handleAddItemsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCourse) return;

    const validItems = itemsList.filter(item => item.itemName.trim() && item.requiredQuantity > 0);
    
    if (validItems.length === 0) {
      toast({ title: "Please add at least one valid item", variant: "destructive" });
      return;
    }

    addItemsMutation.mutate({
      courseId: selectedCourse.id,
      items: validItems,
    });
  };

  const addItemRow = () => {
    setItemsList([...itemsList, { itemName: "", requiredQuantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    setItemsList(itemsList.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof CourseItemRequest, value: string | number) => {
    const updated = [...itemsList];
    updated[index] = { ...updated[index], [field]: value };
    setItemsList(updated);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      planning: "secondary",
      active: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getItemStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      checking: "secondary",
      sufficient: "default",
      insufficient: "destructive",
      reserved: "outline",
      returned: "default",
      used: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const openItemsDialog = (course: Course) => {
    setSelectedCourse(course);
    setIsItemsDialogOpen(true);
  };

  const openUploadDialog = (course: Course) => {
    setSelectedCourse(course);
    setIsUploadDialogOpen(true);
  };

  const handleFileUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCourse || !selectedFile) return;

    uploadMutation.mutate({
      courseId: selectedCourse.id,
      file: selectedFile,
    });
  };

  const handleFileDownload = async (courseId: number, fileId: number) => {
    try {
      const result = await backend.courses.getDownloadUrl({ courseId, fileId });
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({ title: "Error downloading file", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading courses...</div>;
  }

  const courses = data?.courses || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Course Management</h1>
          <p className="text-muted-foreground">Manage courses and their item requirements</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Course Name *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="instructor">Instructor</Label>
                  <Input id="instructor" name="instructor" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="studentCount">Student Count</Label>
                  <Input id="studentCount" name="studentCount" type="number" min="1" />
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="date" />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Course"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* File Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File for {selectedCourse?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div>
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.xlsx,.xls,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Supported formats: PDF, PowerPoint, Word, Excel, Text files
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploadMutation.isPending || !selectedFile}>
                {uploadMutation.isPending ? "Uploading..." : "Upload File"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Items Dialog */}
      <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add Items to {selectedCourse?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItemsSubmit} className="space-y-4">
            <div className="space-y-3">
              {itemsList.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 items-end">
                  <div>
                    <Label htmlFor={`item-name-${index}`}>Item Name</Label>
                    <Input
                      id={`item-name-${index}`}
                      value={item.itemName}
                      onChange={(e) => updateItem(index, "itemName", e.target.value)}
                      placeholder="Enter item name"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`item-quantity-${index}`}>Required Quantity</Label>
                    <Input
                      id={`item-quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.requiredQuantity}
                      onChange={(e) => updateItem(index, "requiredQuantity", Number(e.target.value))}
                    />
                  </div>
                  <div className="flex space-x-2">
                    {index === itemsList.length - 1 && (
                      <Button type="button" onClick={addItemRow} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                    {itemsList.length > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => removeItemRow(index)} 
                        size="sm"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsItemsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addItemsMutation.isPending}>
                {addItemsMutation.isPending ? "Adding Items..." : "Add Items & Check Stock"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Name</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No courses found
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>{course.instructor || "-"}</TableCell>
                    <TableCell>{course.studentCount || "-"}</TableCell>
                    <TableCell>
                      {course.startDate ? new Date(course.startDate).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(course.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openItemsDialog(course)}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Items
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openUploadDialog(course)}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </Button>
                        
                        {course.status === "planning" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reserveMutation.mutate(course.id)}
                            disabled={reserveMutation.isPending}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        
                        {course.status === "active" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => completeMutation.mutate({ courseId: course.id, returnItems: true })}
                              disabled={completeMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Return Items
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => completeMutation.mutate({ courseId: course.id, returnItems: false })}
                              disabled={completeMutation.isPending}
                            >
                              <Square className="h-4 w-4 mr-1" />
                              Use Items
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Course Details */}
      {selectedCourse && courseDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{selectedCourse.name} - Item Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseDetails.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No items added yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    courseDetails.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell>{item.requiredQuantity}</TableCell>
                        <TableCell>{item.availableQuantity}</TableCell>
                        <TableCell>{item.reservedQuantity}</TableCell>
                        <TableCell>{getItemStatusBadge(item.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{selectedCourse.name} - Course Files</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseDetails.files.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No files uploaded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    courseDetails.files.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">{file.fileName}</TableCell>
                        <TableCell>{file.fileType || "-"}</TableCell>
                        <TableCell>
                          {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : "-"}
                        </TableCell>
                        <TableCell>{new Date(file.uploadedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFileDownload(selectedCourse.id, file.id)}
                          >
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}