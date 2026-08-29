export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'SUPER_ADMIN' | 'PROJECT_MANAGER' | 'FIELD_OFFICER' | 'VIEWER' | 'ADOPTER'
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED'
export type ProjectVisibility = 'PUBLIC' | 'PRIVATE'
export type RehabilitationType =
  | 'REFORESTATION'
  | 'AGROFORESTRY'
  | 'MANGROVE_RESTORATION'
  | 'RIPARIAN_RESTORATION'
  | 'MINE_RECLAMATION'
  | 'WATERSHED_REHABILITATION'
  | 'OTHER'
export type MonitoringStatus = 'RECOVERING' | 'MONITORING' | 'AT_RISK'
export type PlantCondition = 'HEALTHY' | 'STRESSED' | 'DEAD' | 'MISSING' | 'UNKNOWN'
export type SpeciesCategory = 'TREE' | 'SHRUB' | 'GRASS' | 'MANGROVE' | 'OTHER'
export type InterventionType =
  | 'PLANTING'
  | 'REPLANTING'
  | 'MAINTENANCE'
  | 'FERTILIZATION'
  | 'WATERING'
  | 'PEST_CONTROL'
  | 'OTHER'
export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED'
export type QualityFlag = 'HIGH' | 'MEDIUM' | 'LOW'
export type AdoptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
export type UpdateType = 'PROJECT_STORY' | 'FOREST_JOURNAL' | 'MONITORING_UPDATE' | 'IMPACT_REPORT' | 'GENERAL'
export type ProjectMemberRole = 'MANAGER' | 'FIELD_OFFICER' | 'VIEWER'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: UserRole
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role?: UserRole
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: UserRole
          avatar_url?: string | null
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          manager_id: string
          location_name: string
          province: string
          start_date: string
          target_area_ha: number | null
          target_plants: number | null
          status: ProjectStatus
          visibility: ProjectVisibility
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          manager_id: string
          location_name: string
          province: string
          start_date: string
          target_area_ha?: number | null
          target_plants?: number | null
          status?: ProjectStatus
          visibility?: ProjectVisibility
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          manager_id?: string
          location_name?: string
          province?: string
          start_date?: string
          target_area_ha?: number | null
          target_plants?: number | null
          status?: ProjectStatus
          visibility?: ProjectVisibility
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: ProjectMemberRole
          joined_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: ProjectMemberRole
          joined_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: ProjectMemberRole
        }
      }
      plots: {
        Row: {
          id: string
          project_id: string
          name: string
          geom: any
          area_m2: number
          rehabilitation_type: RehabilitationType
          baseline_date: string
          baseline_description: string | null
          target_plants: number | null
          monitoring_status: MonitoringStatus
          adoptable: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          geom: any
          area_m2?: number
          rehabilitation_type: RehabilitationType
          baseline_date: string
          baseline_description?: string | null
          target_plants?: number | null
          monitoring_status?: MonitoringStatus
          adoptable?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          geom?: any
          area_m2?: number
          rehabilitation_type?: RehabilitationType
          baseline_date?: string
          baseline_description?: string | null
          target_plants?: number | null
          monitoring_status?: MonitoringStatus
          adoptable?: boolean
          updated_at?: string
        }
      }
      species: {
        Row: {
          id: string
          common_name: string
          scientific_name: string | null
          category: SpeciesCategory
          native: boolean
          created_at: string
        }
        Insert: {
          id?: string
          common_name: string
          scientific_name?: string | null
          category?: SpeciesCategory
          native?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          common_name?: string
          scientific_name?: string | null
          category?: SpeciesCategory
          native?: boolean
        }
      }
      planting_events: {
        Row: {
          id: string
          plot_id: string
          species_id: string
          date: string
          quantity: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          plot_id: string
          species_id: string
          date: string
          quantity: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          plot_id?: string
          species_id?: string
          date?: string
          quantity?: number
          notes?: string | null
        }
      }
      field_monitorings: {
        Row: {
          id: string
          plot_id: string
          date: string
          geom: any
          gps_accuracy_m: number
          healthy_count: number
          stressed_count: number
          dead_count: number
          missing_count: number
          survival_rate: number | null
          avg_height_cm: number | null
          avg_diameter_cm: number | null
          canopy_cover_pct: number | null
          notes: string | null
          observer_id: string
          sync_status: SyncStatus
          synced_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          plot_id: string
          date: string
          geom: any
          gps_accuracy_m?: number
          healthy_count?: number
          stressed_count?: number
          dead_count?: number
          missing_count?: number
          avg_height_cm?: number | null
          avg_diameter_cm?: number | null
          canopy_cover_pct?: number | null
          notes?: string | null
          observer_id: string
          sync_status?: SyncStatus
          synced_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          plot_id?: string
          date?: string
          geom?: any
          gps_accuracy_m?: number
          healthy_count?: number
          stressed_count?: number
          dead_count?: number
          missing_count?: number
          avg_height_cm?: number | null
          avg_diameter_cm?: number | null
          canopy_cover_pct?: number | null
          notes?: string | null
          observer_id?: string
          sync_status?: SyncStatus
          synced_at?: string | null
        }
      }
      photos: {
        Row: {
          id: string
          monitoring_id: string
          url: string
          thumbnail_url: string | null
          caption: string | null
          taken_at: string | null
          exif_lat: number | null
          exif_lon: number | null
          file_size_bytes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          monitoring_id: string
          url: string
          thumbnail_url?: string | null
          caption?: string | null
          taken_at?: string | null
          exif_lat?: number | null
          exif_lon?: number | null
          file_size_bytes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          monitoring_id?: string
          url?: string
          thumbnail_url?: string | null
          caption?: string | null
          taken_at?: string | null
          exif_lat?: number | null
          exif_lon?: number | null
          file_size_bytes?: number | null
        }
      }
      interventions: {
        Row: {
          id: string
          plot_id: string
          date: string
          type: InterventionType
          quantity: number | null
          description: string
          photo_url: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          plot_id: string
          date: string
          type: InterventionType
          quantity?: number | null
          description: string
          photo_url?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          plot_id?: string
          date?: string
          type?: InterventionType
          quantity?: number | null
          description?: string
          photo_url?: string | null
        }
      }
      satellite_observations: {
        Row: {
          id: string
          plot_id: string
          observation_date: string
          period_start: string
          period_end: string
          ndvi: number | null
          evi: number | null
          ndmi: number | null
          tree_cover_pct: number | null
          bare_land_pct: number | null
          vegetation_pct: number | null
          land_cover_class: string | null
          source_dataset: string
          cloud_cover_pct: number
          valid_pixel_pct: number
          quality_flag: QualityFlag
          created_at: string
        }
        Insert: {
          id?: string
          plot_id: string
          observation_date: string
          period_start: string
          period_end: string
          ndvi?: number | null
          evi?: number | null
          ndmi?: number | null
          tree_cover_pct?: number | null
          bare_land_pct?: number | null
          vegetation_pct?: number | null
          land_cover_class?: string | null
          source_dataset: string
          cloud_cover_pct: number
          valid_pixel_pct: number
          quality_flag?: QualityFlag
          created_at?: string
        }
        Update: {
          id?: string
          plot_id?: string
          observation_date?: string
          period_start?: string
          period_end?: string
          ndvi?: number | null
          evi?: number | null
          ndmi?: number | null
          tree_cover_pct?: number | null
          bare_land_pct?: number | null
          vegetation_pct?: number | null
          land_cover_class?: string | null
          source_dataset?: string
          cloud_cover_pct?: number
          valid_pixel_pct?: number
          quality_flag?: QualityFlag
        }
      }
      adoptions: {
        Row: {
          id: string
          plot_id: string
          supporter_id: string
          start_date: string
          end_date: string | null
          status: AdoptionStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plot_id: string
          supporter_id: string
          start_date?: string
          end_date?: string | null
          status?: AdoptionStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plot_id?: string
          supporter_id?: string
          start_date?: string
          end_date?: string | null
          status?: AdoptionStatus
          updated_at?: string
        }
      }
      project_updates: {
        Row: {
          id: string
          project_id: string
          plot_id: string | null
          date: string
          title: string
          content: string
          update_type: UpdateType
          author_id: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          plot_id?: string | null
          date: string
          title: string
          content: string
          update_type?: UpdateType
          author_id: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          plot_id?: string | null
          date?: string
          title?: string
          content?: string
          update_type?: UpdateType
        }
      }
    }
    Functions: {
      get_project_kpi: {
        Args: { p_project_id: string }
        Returns: {
          total_area_ha: number
          total_plots: number
          total_planted: number
          total_monitorings: number
          avg_survival_rate: number
          plots_recovering: number
          plots_monitoring: number
          plots_at_risk: number
        }
      }
      get_system_overview: {
        Args: {}
        Returns: {
          total_projects: number
          total_plots: number
          total_area_ha: number
          total_planted: number
          total_monitorings: number
          avg_survival_rate: number
          plots_recovering: number
          plots_monitoring: number
          plots_at_risk: number
        }
      }
    }
  }
}
