import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Pagination,
  Select,
  Card,
  Title,
  Container,
  Button,
  TextInput,
  Loader,
  Alert,
} from "@mantine/core";
import axios from "axios";
import { MantineReactTable } from "mantine-react-table";
import { notifications } from "@mantine/notifications";
import {
  downloadExcelRoute,
  fetchApplicationsRoute,
  handleStatusChangeRoute,
  fetchFormFieldsRoute,
} from "../../../routes/placementCellRoutes";

function JobApplicationsTable() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const recordsPerPage = 10;

  const jobId = new URLSearchParams(window.location.search).get("jobId");
  const [fields, setFields] = useState([]);

  useEffect(() => {
    const fetchApplications = async () => {
      const token = localStorage.getItem("authToken");
      try {
        setLoading(true);
        const response = await axios.get(`${fetchApplicationsRoute}${jobId}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setApplications(response.data.students);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };
    const fetchFieldslist = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(fetchFormFieldsRoute, {
          headers: { Authorization: `Token ${token}` },
          params: { jobId: jobId },
        });

        if (response.status === 200) {
          setFields(response.data);
        }
      } catch (error) {
        notifications.show({
          title: "Failed to fetch data",
          message: "Failed to fetch fields list",
          color: "red",
        });
      }
    };

    fetchFieldslist();
    fetchApplications();
  }, [jobId, fetchFormFieldsRoute]);

  const handleStatusChange = (applicationId, status) => {
    const data = { status: status };
    const updateData = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const response = await axios.put(
          `${handleStatusChangeRoute}${applicationId}/`,
          data,
          {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (response.status === 200) {
          setApplications((prevApplications) =>
            prevApplications.map((application) =>
              application.id === applicationId
                ? { ...application, status }
                : application,
            ),
          );

          notifications.show({
            title: "Success",
            message: "Application status updated successfully",
            color: "green",
            position: "top-center",
          });
        } else {
          notifications.show({
            title: "Error",
            message: "Failed to update application status",
            color: "red",
            position: "top-center",
          });
        }
      } catch (error) {
        notifications.show({
          title: "Error",
          message: "Failed to update application status",
          color: "red",
          position: "top-center",
        });

        console.error(error);
      }
    };
    updateData();
  };

  const downloadExcel = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.get(`${downloadExcelRoute}${jobId}/`, {
        headers: { Authorization: `Token ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `applications_${jobId}.xlsx`);
      document.body.appendChild(link);
      link.click();

      notifications.show({
        title: "Success",
        message: "Excel file downloaded successfully",
        color: "green",
        position: "top-center",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to download Excel file",
        color: "red",
        position: "top-center",
      });

      console.error("Error downloading Excel:", error);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 200,
      },
      {
        accessorKey: "roll_no",
        header: "Roll No",
        size: 150,
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 250,
      },
      {
        accessorKey: "cpi",
        header: "CPI",
        size: 100,
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        Cell: ({ row }) => (
          <Select
            data={[
              { value: "accept", label: "Accept" },
              { value: "reject", label: "Reject" },
            ]}
            value={row.original.status}
            onChange={(value) => handleStatusChange(row.original.id, value)}
          />
        ),
      },
    ],
    [],
  );

  const paginatedApplications = applications.slice(
    (activePage - 1) * recordsPerPage,
    activePage * recordsPerPage,
  );

  if (loading) return <Loader />;

  return (
    <Container fluid>
      <Container padding="md" fluid>
        <Container
          fluid
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          my={36}
        >
          <Title order={3}>Student Job Applications</Title>

          <Button onClick={downloadExcel}>Download Excel</Button>
        </Container>

        {applications.length > 0 ? (
          <MantineReactTable columns={columns} data={paginatedApplications} />
        ) : (
          <Alert color="yellow">No applications available</Alert>
        )}
      </Container>
    </Container>
  );
}

export default JobApplicationsTable;
