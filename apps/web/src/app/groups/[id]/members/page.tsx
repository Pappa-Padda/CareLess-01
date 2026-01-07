'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EmojiTransportationIcon from '@mui/icons-material/EmojiTransportation';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import CustomTable, { Column } from '@/components/shared/ui/CustomTable';
import InfoMessage from '@/components/shared/ui/InfoMessage';
import { groupService, GroupMember } from '@/features/groups/groupService';
import { getImageUrl } from '@/utils/images';

interface GroupMembersPageProps {
  params: Promise<{ id: string }>;
}

export default function GroupMembersPage({ params }: GroupMembersPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const groupId = Number(resolvedParams.id);

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      if (isNaN(groupId)) {
        setError('Invalid Group ID');
        setLoading(false);
        return;
      }
      
      try {
        const data = await groupService.getGroupMembers(groupId);
        setMembers(data.members);
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to load members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [groupId]);

  const columns: Column<GroupMember>[] = [
    { id: 'profilePicture', label: '', width: 60 },
    { id: 'name', label: 'Name', sortable: true },
    { id: 'phoneNumber', label: 'Contact', sortable: true },
    { id: 'isDriver', label: 'Role', sortable: true }, 
    { id: 'isAdmin', label: 'Status', sortable: true },
  ];

  const renderCell = (member: GroupMember, column: Column<GroupMember>) => {
    switch (column.id) {
      case 'profilePicture':
        return (
          <Avatar 
            src={getImageUrl(member.profilePicture)} 
            alt={member.name}
            sx={{ width: 40, height: 40 }}
          >
            {member.name.charAt(0)}
          </Avatar>
        );
      case 'name':
        return (
            <Box>
                <Typography variant="body1" fontWeight="medium">{member.name}</Typography>
            </Box>
        );
      case 'phoneNumber':
        return (
            <Typography variant="body2" color="text.secondary">
                {member.phoneNumber || '-'}
            </Typography>
        );
      case 'isDriver':
        return member.isDriver ? (
            <Chip 
                icon={<DirectionsCarIcon fontSize="small" />} 
                label="Driver" 
                color="primary" 
                variant="outlined" 
                size="small" 
            />
        ) : (
             <Chip 
                icon={<EmojiTransportationIcon fontSize="small" />} 
                label="Passenger" 
                variant="outlined" 
                size="small" 
            />
        );
      case 'isAdmin':
        return member.isAdmin ? (
             <Chip 
                icon={<AdminPanelSettingsIcon fontSize="small" />} 
                label="Admin" 
                color="secondary" 
                size="small" 
            />
        ) : (
            <Typography variant="caption" color="text.secondary">Member</Typography>
        );
      default:
        return null;
    }
  };

  if (error) {
    return (
      <PageContainer>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <IconButton onClick={() => router.back()} color="primary">
                <ArrowBackIcon />
            </IconButton>
            <PageHeading>Group Members</PageHeading>
        </Box>
        <InfoMessage message={error} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Tooltip title="Back to Groups">
             <IconButton onClick={() => router.back()} color="default" size="medium" sx={{ ml: -1 }}>
                <ArrowBackIcon />
             </IconButton>
        </Tooltip>
        <PageHeading>Group Members</PageHeading>
      </Box>

      <CustomTable
        columns={columns}
        data={members}
        isLoading={loading}
        renderCell={renderCell}
        emptyMessage="No members found in this group."
      />
    </PageContainer>
  );
}