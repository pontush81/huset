import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertBookingSchema, insertDocumentSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Define a custom Request type that includes the file property from multer
interface FileRequest extends Request {
  file?: Express.Multer.File;
}

// For ES modules to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    },
  }),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all handbook sections
  app.get("/api/sections", async (req: Request, res: Response) => {
    try {
      const sections = await storage.getSections();
      res.json(sections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      res.status(500).json({ error: "Failed to fetch sections" });
    }
  });

  // Get a specific section by slug
  app.get("/api/sections/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const section = await storage.getSectionBySlug(slug);
      
      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }
      
      res.json(section);
    } catch (error) {
      console.error("Error fetching section:", error);
      res.status(500).json({ error: "Failed to fetch section" });
    }
  });
  
  // Update section content and metadata
  app.patch("/api/sections/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { content, title, slug, icon } = req.body;
      
      const updateData: any = {};
      
      // Validera vilka fält som ska uppdateras
      if (content !== undefined) updateData.content = content;
      if (title !== undefined) updateData.title = title;
      if (slug !== undefined) updateData.slug = slug;
      if (icon !== undefined) updateData.icon = icon;
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid update fields provided" });
      }
      
      const sectionId = parseInt(id);
      if (isNaN(sectionId)) {
        return res.status(400).json({ error: "Invalid section ID" });
      }
      
      const updatedSection = await storage.updateSectionData(sectionId, updateData);
      
      if (!updatedSection) {
        return res.status(404).json({ error: "Section not found" });
      }
      
      res.json(updatedSection);
    } catch (error) {
      console.error("Error updating section:", error);
      res.status(500).json({ error: "Failed to update section" });
    }
  });
  
  // Add a new section
  app.post("/api/sections", async (req: Request, res: Response) => {
    try {
      const { title, slug, icon, content } = req.body;
      
      if (!title || !slug) {
        return res.status(400).json({ error: "Title and slug are required" });
      }
      
      // Kontrollera om slug redan finns
      const existingSection = await storage.getSectionBySlug(slug);
      if (existingSection) {
        return res.status(400).json({ error: "A section with this slug already exists" });
      }
      
      const newSection = await storage.createSection({
        title,
        slug,
        icon: icon || "fa-file-alt",
        content: content || "Nytt innehåll",
      });
      
      res.status(201).json(newSection);
    } catch (error) {
      console.error("Error creating section:", error);
      res.status(500).json({ error: "Failed to create section" });
    }
  });
  
  // Delete a section
  app.delete("/api/sections/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const sectionId = parseInt(id);
      
      if (isNaN(sectionId)) {
        return res.status(400).json({ error: "Invalid section ID" });
      }
      
      // Verify the section exists
      const section = await storage.getSectionById(sectionId);
      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }
      
      // Prevent deletion of essential sections
      const essentialSlugs = ['gastlagenhet', 'ellagarden', 'styrelse'];
      if (essentialSlugs.includes(section.slug)) {
        return res.status(403).json({ 
          error: "Cannot delete essential section",
          message: "Denna sektion är väsentlig för handboken och kan inte raderas"
        });
      }
      
      const success = await storage.deleteSection(sectionId);
      
      if (success) {
        res.status(200).json({ message: "Section deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete section" });
      }
    } catch (error) {
      console.error("Error deleting section:", error);
      res.status(500).json({ error: "Failed to delete section" });
    }
  });
  
  // Get all documents
  app.get("/api/documents", async (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      
      let documents;
      if (category && typeof category === 'string') {
        documents = await storage.getDocumentsByCategory(category);
      } else {
        documents = await storage.getDocuments();
      }
      
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });
  
  // Upload a document
  app.post("/api/documents", upload.single("file"), async (req: FileRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const documentData = {
        title: req.body.title,
        description: req.body.description || "",
        category: req.body.category,
        filename: req.file.filename,
        mimeType: req.file.mimetype,
      };
      
      const parsedData = insertDocumentSchema.safeParse(documentData);
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          error: fromZodError(parsedData.error).message 
        });
      }
      
      const document = await storage.createDocument(parsedData.data);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });
  
  // Serve a document file
  app.get("/api/documents/:id/file", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(parseInt(id));
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      const filePath = path.join(__dirname, "uploads", document.filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }
      
      res.setHeader("Content-Type", document.mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${document.title}"`);
      
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      console.error("Error serving document:", error);
      res.status(500).json({ error: "Failed to serve document" });
    }
  });
  
  // Delete a document
  app.delete("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(parseInt(id));
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      const success = await storage.deleteDocument(parseInt(id));
      
      if (success) {
        // Delete the file
        const filePath = path.join(__dirname, "uploads", document.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        res.status(200).json({ message: "Document deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete document" });
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });
  
  // Get all bookings
  app.get("/api/bookings", async (req: Request, res: Response) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });
  
  // Create a booking
  app.post("/api/bookings", async (req: Request, res: Response) => {
    try {
      console.log("Received booking request:", req.body);
      
      const parsedData = insertBookingSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        console.log("Validation error:", parsedData.error);
        return res.status(400).json({ 
          error: fromZodError(parsedData.error).message 
        });
      }
      
      // Convert string dates to Date objects
      const checkInDate = new Date(parsedData.data.checkInDate);
      const checkOutDate = new Date(parsedData.data.checkOutDate);
      
      // Validate dates
      if (checkInDate >= checkOutDate) {
        return res.status(400).json({
          error: "Utcheckningsdatumet måste vara efter incheckningsdatumet"
        });
      }
      
      // Check for availability
      const overlappingBookings = await storage.getBookingsForDateRange(
        checkInDate, 
        checkOutDate
      );
      
      if (overlappingBookings.length > 0) {
        return res.status(400).json({
          error: "Gästlägenheten är inte tillgänglig för de valda datumen"
        });
      }
      
      // Handle the date conversion correctly for storage
      // Create a booking with confirmed status automatically
      const booking = await storage.createBooking({
        ...parsedData.data,
        // Keep original string format for the storage layer
        checkInDate: parsedData.data.checkInDate,
        checkOutDate: parsedData.data.checkOutDate,
        status: 'confirmed' // Set status to confirmed automatically
      });
      
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ error: "Det gick inte att skapa bokningen" });
    }
  });
  
  // Update booking status (confirm or cancel)
  app.patch("/api/bookings/:id/status", async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(bookingId)) {
        return res.status(400).json({ error: "Ogiltigt boknings-ID" });
      }
      
      if (!status || (status !== 'pending' && status !== 'confirmed' && status !== 'cancelled')) {
        return res.status(400).json({ error: "Ogiltig bokningsstatus" });
      }
      
      const updatedBooking = await storage.updateBookingStatus(bookingId, status);
      
      if (!updatedBooking) {
        return res.status(404).json({ error: "Bokningen hittades inte" });
      }
      
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ error: "Det gick inte att uppdatera bokningsstatusen" });
    }
  });
  
  // Get bookings for a date range (for calendar)
  app.get("/api/bookings/availability", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
        return res.status(400).json({ error: "Both startDate and endDate are required" });
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      
      const bookings = await storage.getBookingsForDateRange(start, end);
      
      // Return only necessary booking info for calendar display
      const calendarBookings = bookings.map(booking => ({
        id: booking.id,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        status: booking.status
      }));
      
      res.json(calendarBookings);
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ error: "Failed to fetch availability" });
    }
  });
  
  // Export bookings data
  app.get("/api/bookings/export", async (req: Request, res: Response) => {
    try {
      const exportFileName = await storage.exportBookings();
      
      // Send the file path for download
      res.json({ 
        success: true, 
        message: "Bokningar har exporterats", 
        fileName: exportFileName,
        downloadUrl: `/api/bookings/download/${exportFileName}`
      });
    } catch (error) {
      console.error("Error exporting bookings:", error);
      res.status(500).json({ error: "Det gick inte att exportera bokningarna" });
    }
  });
  
  // Download exported bookings file
  app.get("/api/bookings/download/:filename", async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      
      // Security check to prevent directory traversal
      if (filename.includes("..") || !filename.endsWith(".json")) {
        return res.status(400).json({ error: "Invalid filename" });
      }
      
      const filePath = path.join(__dirname, '../data', filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Filen hittades inte" });
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      
      // Stream the file to the response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading export file:", error);
      res.status(500).json({ error: "Det gick inte att ladda ner filen" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
