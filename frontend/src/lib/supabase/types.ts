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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "projects_manager_id_fkey"
            columns: ["manager_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "plots_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "planting_events_plot_id_fkey"
            columns: ["plot_id"]
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planting_events_species_id_fkey"
            columns: ["species_id"]
            referencedRelation: "species"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "field_monitorings_plot_id_fkey"
            columns: ["plot_id"]
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_monitorings_observer_id_fkey"
            columns: ["observer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "photos_monitoring_id_fkey"
            columns: ["monitoring_id"]
            referencedRelation: "field_monitorings"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "interventions_plot_id_fkey"
            columns: ["plot_id"]
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "satellite_observations_plot_id_fkey"
            columns: ["plot_id"]
            referencedRelation: "plots"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "adoptions_plot_id_fkey"
            columns: ["plot_id"]
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adoptions_supporter_id_fkey"
            columns: ["supporter_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_plot_id_fkey"
            columns: ["plot_id"]
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id: string
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
    Enums: {
      user_role: UserRole
      project_status: ProjectStatus
      project_visibility: ProjectVisibility
      rehabilitation_type: RehabilitationType
      monitoring_status: MonitoringStatus
      plant_condition: PlantCondition
      species_category: SpeciesCategory
      intervention_type: InterventionType
      sync_status: SyncStatus
      quality_flag: QualityFlag
      adoption_status: AdoptionStatus
      update_type: UpdateType
      project_member_role: ProjectMemberRole
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Project = Database['public']['Tables']['projects']['Row']
export type Plot = Database['public']['Tables']['plots']['Row']
export type UserProfile = Database['public']['Tables']['users']['Row']
export type FieldMonitoring = Database['public']['Tables']['field_monitorings']['Row']
export type Photo = Database['public']['Tables']['photos']['Row']
export type Intervention = Database['public']['Tables']['interventions']['Row']
export type PlantingEvent = Database['public']['Tables']['planting_events']['Row']
export type Species = Database['public']['Tables']['species']['Row']
export type ProjectMember = Database['public']['Tables']['project_members']['Row']
