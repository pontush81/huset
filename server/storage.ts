import { 
  users, type User, type InsertUser,
  documents, type Document, type InsertDocument,
  bookings, type Booking, type InsertBooking,
  sections, type Section, type InsertSection
} from "@shared/schema";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format } from 'date-fns';

// Get the directory name in ES modules context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path for bookings file
const BOOKINGS_FILE = path.join(__dirname, '../data/bookings.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, '../data'))) {
  fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
}

// Storage interface for all operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document operations
  getDocuments(): Promise<Document[]>;
  getDocumentsByCategory(category: string): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Booking operations
  getBookings(): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  getBookingsForDateRange(startDate: Date, endDate: Date): Promise<Booking[]>;
  exportBookings(): Promise<string>; // Added method for exporting bookings
  
  // Section operations
  getSections(): Promise<Section[]>;
  getSectionBySlug(slug: string): Promise<Section | undefined>;
  createSection(section: InsertSection): Promise<Section>;
  updateSection(id: number, content: string): Promise<Section | undefined>;
  updateSectionData(id: number, data: {
    content?: string;
    title?: string;
    slug?: string;
    icon?: string;
  }): Promise<Section | undefined>;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private bookings: Map<number, Booking>;
  private sections: Map<number, Section>;
  
  private userCurrentId: number;
  private documentCurrentId: number;
  private bookingCurrentId: number;
  private sectionCurrentId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.bookings = new Map();
    this.sections = new Map();
    
    this.userCurrentId = 1;
    this.documentCurrentId = 1;
    this.bookingCurrentId = 1;
    this.sectionCurrentId = 1;
    
    // Initialize with default handbook sections
    this.initializeDefaultSections();
    
    // Load bookings from file if it exists
    this.loadBookingsFromFile();
  }
  
  // Load bookings from file
  private loadBookingsFromFile(): void {
    try {
      if (fs.existsSync(BOOKINGS_FILE)) {
        const bookingsData = fs.readFileSync(BOOKINGS_FILE, 'utf8');
        const bookingsArray: Booking[] = JSON.parse(bookingsData);
        
        // Find highest booking ID to ensure new IDs don't clash
        let maxId = 0;
        
        bookingsArray.forEach(booking => {
          this.bookings.set(booking.id, booking);
          maxId = Math.max(maxId, booking.id);
        });
        
        // Update the booking ID counter
        if (maxId > 0) {
          this.bookingCurrentId = maxId + 1;
        }
        
        console.log(`Loaded ${bookingsArray.length} bookings from file.`);
      }
    } catch (error) {
      console.error('Error loading bookings from file:', error);
    }
  }
  
  // Save bookings to file
  private saveBookingsToFile(): void {
    try {
      const bookingsArray = Array.from(this.bookings.values());
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookingsArray, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving bookings to file:', error);
    }
  }

  // Initialize default sections for the handbook
  private initializeDefaultSections(): void {
    const defaultSections: InsertSection[] = [
      {
        title: "Aktivitetsrum",
        slug: "aktivitetsrum",
        content: "Information om föreningens aktivitetsrum och hur man bokar det.",
        icon: "fa-running"
      },
      {
        title: "Elbil",
        slug: "elbil",
        content: "Information om laddstationer för elbilar i föreningen.",
        icon: "fa-car-side"
      },
      {
        title: "Ellagården",
        slug: "ellagarden",
        content: "Allmän information om bostadsrättsföreningen Ellagården.",
        icon: "fa-home"
      },
      {
        title: "Stämma",
        slug: "stamma",
        content: "Information om föreningens årsstämma och extra stämmor.",
        icon: "fa-users"
      },
      {
        title: "Grillregler",
        slug: "grillregler",
        content: "Regler för grillning på balkonger och i gemensamma utrymmen.",
        icon: "fa-fire"
      },
      {
        title: "Gästlägenhet",
        slug: "gastlagenhet",
        content: "Vår förening har en gästlägenhet som medlemmar kan boka för sina gäster. Lägenheten ligger på bottenplan i hus 3 och har plats för upp till 4 personer.",
        icon: "fa-bed"
      },
      {
        title: "Färgkoder",
        slug: "fargkoder",
        content: "Färgkoder för målning av dörrar, fönster och andra detaljer i föreningen.",
        icon: "fa-paint-brush"
      },
      {
        title: "Sophantering",
        slug: "sophantering",
        content: "Information om sophantering, återvinning och miljörum.",
        icon: "fa-trash-alt"
      },
      {
        title: "Styrelse",
        slug: "styrelse",
        content: "Information om föreningens styrelse och kontaktuppgifter.",
        icon: "fa-users-cog"
      }
    ];

    defaultSections.forEach(section => {
      this.createSection(section);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Document methods
  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async getDocumentsByCategory(category: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      doc => doc.category === category
    );
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentCurrentId++;
    const now = new Date();
    const document: Document = { 
      ...insertDocument, 
      id, 
      uploadedAt: now,
      // Ensure description is never undefined
      description: insertDocument.description || null
    };
    this.documents.set(id, document);
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Booking methods
  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.bookingCurrentId++;
    const now = new Date();
    const booking: Booking = { 
      ...insertBooking, 
      id, 
      status: insertBooking.status || 'confirmed', // Sätt status till 'confirmed' som standard
      createdAt: now,
      // Ensure message is never undefined
      message: insertBooking.message || null
    };
    this.bookings.set(id, booking);
    
    // Save bookings to file after creating a new one
    this.saveBookingsToFile();
    
    return booking;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, status };
    this.bookings.set(id, updatedBooking);
    
    // Save bookings to file after updating status
    this.saveBookingsToFile();
    
    return updatedBooking;
  }
  
  // Export bookings for backup and reporting
  async exportBookings(): Promise<string> {
    try {
      const bookings = Array.from(this.bookings.values());
      
      // Format date for filename
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const filename = `bookings-export-${dateStr}.json`;
      const exportPath = path.join(__dirname, '../data', filename);
      
      // Create a formatted version of the bookings with human-readable dates
      const formattedBookings = bookings.map(booking => {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        const created = new Date(booking.createdAt);
        
        return {
          ...booking,
          checkInDate_formatted: format(checkIn, 'yyyy-MM-dd'),
          checkOutDate_formatted: format(checkOut, 'yyyy-MM-dd'),
          createdAt_formatted: format(created, 'yyyy-MM-dd HH:mm:ss'),
          nights: Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        };
      });
      
      // Write the export file
      fs.writeFileSync(exportPath, JSON.stringify(formattedBookings, null, 2), 'utf8');
      
      return filename;
    } catch (error) {
      console.error('Error exporting bookings:', error);
      throw new Error('Failed to export bookings');
    }
  }

  async getBookingsForDateRange(startDate: Date, endDate: Date): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      
      // Check if booking period overlaps with the given date range
      return (
        (checkIn <= endDate && checkOut >= startDate) &&
        booking.status !== 'cancelled'
      );
    });
  }

  // Section methods
  async getSections(): Promise<Section[]> {
    return Array.from(this.sections.values());
  }

  async getSectionBySlug(slug: string): Promise<Section | undefined> {
    return Array.from(this.sections.values()).find(
      section => section.slug === slug
    );
  }

  async createSection(insertSection: InsertSection): Promise<Section> {
    const id = this.sectionCurrentId++;
    const now = new Date();
    const section: Section = { 
      ...insertSection, 
      id, 
      updatedAt: now,
      // Ensure icon is never undefined
      icon: insertSection.icon || "fa-file-alt"
    };
    this.sections.set(id, section);
    return section;
  }

  async updateSection(id: number, content: string): Promise<Section | undefined> {
    const section = this.sections.get(id);
    if (!section) return undefined;
    
    const now = new Date();
    const updatedSection = { ...section, content, updatedAt: now };
    this.sections.set(id, updatedSection);
    return updatedSection;
  }
  
  async updateSectionData(id: number, data: {
    content?: string;
    title?: string;
    slug?: string;
    icon?: string;
  }): Promise<Section | undefined> {
    const section = this.sections.get(id);
    if (!section) return undefined;
    
    // Om vi uppdaterar slug, kontrollera så att det inte redan finns
    if (data.slug && data.slug !== section.slug) {
      const existingSection = await this.getSectionBySlug(data.slug);
      if (existingSection && existingSection.id !== id) {
        throw new Error("A section with this slug already exists");
      }
    }
    
    const now = new Date();
    const updatedSection = { 
      ...section, 
      ...data,
      updatedAt: now 
    };
    
    this.sections.set(id, updatedSection);
    return updatedSection;
  }
}

// Export the storage instance
export const storage = new MemStorage();
