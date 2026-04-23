import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const STORAGE_KEY = 'overwatch_settings';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-panel.html'
})
export class SettingsPanelComponent implements OnInit {
  saved = false;

  settings = {
    facility:           'SECTOR-7G',
    operatorName:       'Operator',
    accessLevel:        'Level 3',
    refreshInterval:    2000,
    alertSoundEnabled:  true,
    criticalBlink:      true,
    complianceStandard: 'IEC 62443-3-3 SL2',
    sessionTimeout:     30,
    llmApiKey:          '',
    llmModel:           'gpt-4o',
    firebaseProject:    '',
  };

  refreshOptions = [
    { label: '500ms', value: 500   },
    { label: '1s',    value: 1000  },
    { label: '2s',    value: 2000  },
    { label: '5s',    value: 5000  },
  ];

  // FIX: load persisted settings on init
  ngOnInit() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) this.settings = { ...this.settings, ...JSON.parse(saved) };
    } catch {}
  }

  // FIX: actually persist to localStorage
  saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {}
    this.saved = true;
    setTimeout(() => this.saved = false, 2500);
  }

  resetDefaults() {
    localStorage.removeItem(STORAGE_KEY);
    this.settings = {
      facility: 'SECTOR-7G', operatorName: 'Operator', accessLevel: 'Level 3',
      refreshInterval: 2000, alertSoundEnabled: true, criticalBlink: true,
      complianceStandard: 'IEC 62443-3-3 SL2', sessionTimeout: 30,
      llmApiKey: '', llmModel: 'gpt-4o', firebaseProject: '',
    };
    this.saved = false;
  }
}
