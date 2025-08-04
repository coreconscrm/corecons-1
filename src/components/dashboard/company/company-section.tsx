
"use client";

import { useState, useEffect } from "react";
import { DocumentsCard, type Document } from "../documents-card";
import { TeamListCard } from "../study-time-analysis-card";
import { CompanyProfilesCard, type Company } from "../company-card";
import { DiskSection } from "./disk-section";
import { LinksSection } from "./links-section";
import { Button } from "@/components/ui/button";

export function CompanySection({
    companies, onAddCompany, onUpdateCompany, onDeleteCompany,
    documents, onAddDocument, onDeleteDocument,
    team, onAddTeamMember, onUpdateTeamMember, onDeleteTeamMember,
    diskItems, onUploadFile, onCreateFolder, onDeleteItem, onMoveItem, fetchDiskItems,
    visibleTabs,
    links, linkSections, onAddItem, onUpdateItem, onDeleteLinkItem
}: {
    companies: Company[], onAddCompany: (c: any) => Promise<void>, onUpdateCompany: (c: any) => Promise<void>, onDeleteCompany: (id: string) => Promise<void>,
    documents: Document[], onAddDocument: (d: any) => void, onDeleteDocument: (id: string) => void,
    team: any[], onAddTeamMember: (member: any) => void, onUpdateTeamMember: (member: any) => void, onDeleteTeamMember: (id: any) => void,
    diskItems: any[], onUploadFile: (path: string, file: File) => Promise<void>, onCreateFolder: (path: string, folderName: string) => Promise<void>, onDeleteItem: (path: string, type: 'file' | 'folder') => Promise<void>, onMoveItem: (sourcePath: string, destPath: string) => Promise<void>, fetchDiskItems: (path?: string) => Promise<any[]>,
    visibleTabs: any,
    links: any[], linkSections: any[], onAddItem: (collection: string, item: any) => Promise<void>, onUpdateItem: (collection: string, item: any) => Promise<void>, onDeleteLinkItem: (collection: string, id: string) => Promise<void>
}) {
    const tabs = [
        { value: "profiles", label: "Perfiles de Empresa", visible: visibleTabs.companies },
        { value: "disk", label: "Disco", visible: visibleTabs.companies },
        { value: "links", label: "Enlaces", visible: visibleTabs.companies },
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
        <div className="w-full space-y-6">
             <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {tabs.map(tab => (
                    <Button
                        key={tab.value}
                        variant={activeTab === tab.value ? "default" : "outline"}
                        onClick={() => handleTabChange(tab.value)}
                        className="w-full"
                    >
                        {tab.label}
                    </Button>
                ))}
            </div>

            <div className="mt-6">
                {activeTab === 'profiles' && visibleTabs.companies && (
                    <CompanyProfilesCard 
                        companies={companies}
                        onAddCompany={onAddCompany}
                        onUpdateCompany={onUpdateCompany}
                        onDeleteCompany={onDeleteCompany}
                    />
                )}
                {activeTab === 'disk' && visibleTabs.companies && (
                    <DiskSection
                        initialItems={diskItems}
                        onUploadFile={onUploadFile}
                        onCreateFolder={onCreateFolder}
                        onDeleteItem={onDeleteItem}
                        onMoveItem={onMoveItem}
                        fetchItems={fetchDiskItems}
                    />
                )}
                {activeTab === 'links' && visibleTabs.companies && (
                    <LinksSection
                        links={links}
                        sections={linkSections}
                        onAddLink={(link: any) => onAddItem('company_links', link)}
                        onUpdateLink={(link: any) => onUpdateItem('company_links', link)}
                        onDeleteLink={(id: string) => onDeleteLinkItem('company_links', id)}
                        onAddSection={(section: any) => onAddItem('link_sections', section)}
                        onUpdateSection={(section: any) => onUpdateItem('link_sections', section)}
                        onDeleteSection={(id: string) => onDeleteLinkItem('link_sections', id)}
                    />
                )}
                {activeTab === 'documents' && visibleTabs.companies && (
                    <DocumentsCard 
                        documents={documents}
                        onAddDocument={onAddDocument}
                        onDeleteDocument={onDeleteDocument}
                    />
                )}
                {activeTab === 'team' && visibleTabs.team && (
                    <TeamListCard team={team} onAddTeamMember={onAddTeamMember} onUpdateTeamMember={onUpdateTeamMember} onDeleteTeamMember={onDeleteTeamMember} />
                )}
            </div>
        </div>
    )
}
