# Ilam Province Cryptocurrency Miner Detection System

## Overview

This is a comprehensive cryptocurrency miner detection system specifically designed for Ilam Province, Iran. The application combines a React-based frontend with an Express.js backend to provide real-time monitoring, detection, and geolocation of cryptocurrency mining devices within the provincial boundaries.

The system features advanced network scanning, device fingerprinting, geographical mapping, and automated reporting capabilities with a Persian/Farsi interface optimized for regional use.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with custom Persian/RTL support
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket connection for live updates
- **Maps**: Leaflet integration for interactive geographical visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket server for live data streaming
- **External Services**: Python-based detection services
- **Build System**: Vite for frontend, esbuild for backend

### Database Schema
- **detected_miners**: Core table storing miner device information
- **network_connections**: Network traffic and connection data
- **scan_sessions**: Scan history and session management
- **system_activities**: System logs and activity tracking

## Key Components

### Detection Engine
- **Network Scanner**: Multi-threaded network device discovery
- **Port Scanner**: Targeted scanning of cryptocurrency mining ports
- **Device Fingerprinting**: Hardware and software identification
- **Geolocation**: IP-based geographical positioning within Ilam province
- **Confidence Scoring**: ML-based threat assessment

### Geographic Mapping
- **Interactive Maps**: Real-time visualization of detected devices
- **Provincial Boundaries**: Specific focus on Ilam province coordinates
- **City Mapping**: Integration with major Ilam cities and regions
- **Heat Maps**: Density visualization of mining activity

### Real-time Monitoring
- **Live Dashboard**: Real-time statistics and device status
- **WebSocket Updates**: Instant notifications for new detections
- **Scanning Controls**: Manual and automated scan management
- **Activity Logs**: Comprehensive system activity tracking

### Reporting System
- **Statistics Overview**: Device counts, threat levels, power consumption
- **Export Functionality**: Database export and report generation
- **Persian Interface**: Full RTL support with Vazirmatn font

## Data Flow

1. **Detection Phase**: Python services scan network ranges and identify potential mining devices
2. **Analysis Phase**: Collected data is processed and scored for threat assessment
3. **Storage Phase**: Device information is stored in PostgreSQL database
4. **Notification Phase**: Real-time updates are broadcast via WebSocket
5. **Visualization Phase**: Frontend displays updated information on maps and dashboards

## External Dependencies

### Core Libraries
- **Frontend**: React, Radix UI, Tailwind CSS, Leaflet, TanStack Query
- **Backend**: Express.js, Drizzle ORM, WebSocket (ws)
- **Database**: PostgreSQL with Neon Database support
- **Python Services**: Network scanning, geolocation, and device detection

### Development Tools
- **TypeScript**: Type safety across the entire stack
- **Vite**: Fast development and optimized builds
- **PostCSS**: CSS processing with Tailwind
- **ESLint/Prettier**: Code formatting and quality

### External APIs
- **IP Geolocation**: Multiple providers for accurate positioning
- **Network Intelligence**: Device identification and threat assessment
- **OSINT Sources**: Open source intelligence for device verification

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite dev server with real-time updates
- **TypeScript Checking**: Continuous type validation
- **WebSocket**: Development WebSocket server
- **Database**: Local PostgreSQL or Neon development database

### Production Build
- **Frontend**: Static assets built with Vite and served via Express
- **Backend**: Compiled TypeScript bundle with esbuild
- **Database**: Production PostgreSQL with connection pooling
- **Process Management**: PM2 or similar for process supervision

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **NODE_ENV**: Environment specification (development/production)
- **API Keys**: External service authentication
- **Network Configuration**: Scanning ranges and target specifications

## Changelog

```
Changelog:
- June 28, 2025: Initial setup
- June 28, 2025: Implemented real-world cryptocurrency miner detection system
  * Added comprehensive RF signal analysis service for electromagnetic detection
  * Created owner identification system using official Iranian telecom databases  
  * Built live interactive map with real geolocation and routing capabilities
  * Integrated real Iranian geographical data with official IP ranges for all provinces
  * Added multi-page architecture with tabbed interface (Overview, Live Map, Owner ID, RF Analysis, Database)
  * Implemented real-time WebSocket communication for live updates
  * Added Persian RTL interface with B.Nazanin font support
  * Created secure authentication system (username: qwerty, password: azerty)
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```