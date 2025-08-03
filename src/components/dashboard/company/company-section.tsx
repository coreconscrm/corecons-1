
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentsCard, type Document } from "../documents-card";
import { TeamListCard } from "../study-time-analysis-card";
import { CompanyProfilesCard, type Company } from "../company-card";
import { DiskSection } from "./disk-section";

export function CompanySection({
    companies, onAddCompany, onUpdateCompany, onDeleteCompany,
    documents, onAddDocument, onDeleteDocument,
    team, onAddTeamMember, onUpdateTeamMember, onDeleteTeamMember,
    diskItems, onUploadFile, onCreateFolder, onDeleteItem,
    visibleTabs
}: {
    companies: Company[], onAddCompany: (c: any) => Promise<void>, onUpdateCompany: (c: any) => Promise<void>, onDeleteCompany: (id: string) => Promise<void>,
    documents: Document[], onAddDocument: (d: any) => void, onDeleteDocument: (id: string) => void,
    team: any[], onAddTeamMember: (member: any) => void, onUpdateTeamMember: (member: any) => void, onDeleteTeamMember: (id: any) => void,
    diskItems: any[], onUploadFile: (path: string, file: File) => Promise<void>, onCreateFolder: (path: string, folderName: string) => Promise<void>, onDeleteItem: (path: string, type: 'file' | 'folder') => Promise<void>,
    visibleTabs: any
}) {
    const tabs = [
        { value: "profiles", label: "Perfiles de Empresa", visible: visibleTabs.companies },
        { value: "disk", label: "Disco", visible: visibleTabs.companies },
        { value: "documents", label: "Documentos Generales", visible: visibleTabs.companies },
        { value: "team", label: "Equipo", visible: visibleTabs.team },
    ].filter(tab => tab.visible);

    const defaultTab = tabs.length > 0 ? tabs[0].value : "";
    const [activeTab, setActiveTab] = useState(defaultTab);
    
    useEffect(() => {
        const savedTab = localStorage.getItem('companySection_activeTab');
        if (savedTab && tabs.some(t => t.value === savedTab)) {
            setActiveTab(savedTab);
        } else if (tabs.length > 0) {
            setActiveTab(tabs[0].value);
        }
    }, [visibleTabs, tabs]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        localStorage.setItem('companySection_activeTab', value);
    };

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length || 1}, 1fr)`}}>
                {tabs.map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
            </TabsList>
            {visibleTabs.companies && (
                <TabsContent value="profiles" className="mt-6">
                    <CompanyProfilesCard 
                        companies={companies}
                        onAddCompany={onAddCompany}
                        onUpdateCompany={onUpdateCompany}
                        onDeleteCompany={onDeleteCompany}
                    />
                </TabsContent>
            )}
             {visibleTabs.companies && (
                <TabsContent value="disk" className="mt-6">
                    <DiskSection
                        items={diskItems}
                        onUploadFile={onUploadFile}
                        onCreateFolder={onCreateFolder}
                        onDeleteItem={onDeleteItem}
                    />
                </TabsContent>
            )}
            {visibleTabs.companies && (
                <TabsContent value="documents" className="mt-6">
                    <DocumentsCard 
                        documents={documents}
                        onAddDocument={onAddDocument}
                        onDeleteDocument={onDeleteDocument}
                    />
                </TabsContent>
            )}
            {visibleTabs.team && (
                 <TabsContent value="team" className="mt-6">
                    <TeamListCard team={team} onAddTeamMember={onAddTeamMember} onUpdateTeamMember={onUpdateTeamMember} onDeleteTeamMember={onDeleteTeamMember} />
                </TabsContent>
            )}
        </Tabs>
    )
}
