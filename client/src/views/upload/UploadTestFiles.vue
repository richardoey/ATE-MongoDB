<template>
  <a-row style="margin-bottom: 10px">
    <div id="app">
      <dashboard
        :uppy="uppy"
        :props="{ theme: 'light', width: 350, height: 350 }"
      />
    </div>
    <a-form
      id="fileForm"
      ref="formRef"
      :model="formState"
      :rules="rules"
      :label-col="labelCol"
      :wrapper-col="wrapperCol"
      style="width: 500px"
    >
      <a-form-item label="Project" name="project">
        <a-select
          v-model:value="formState.project"
          show-search
          placeholder="Select a project"
          option-filter-prop="label"
          :filter-option="filterOption"
          @change="getStations"
          name="project_id"
        >
          <a-select-option
            v-for="project in projects"
            :value="project.name"
            :key="project._id"
            >{{ project.name }}</a-select-option
          >
        </a-select>
      </a-form-item>
      <a-form-item label="Station" name="station">
        <a-select v-model:value="formState.station" name="station_id">
          <a-select-option
            v-for="(station, index) in projectStations"
            placeholder="Select a station"
            :selected="index == 0 ? true : false"
            :value="station.value"
            :key="station._id"
            >{{ station.value }}</a-select-option
          >
        </a-select>
      </a-form-item>
      <a-form-item label="Test" name="test">
        <a-select
          v-model:value="formState.test"
          placeholder="Select .txt type"
          name="test_file"
      >
          <a-select-option value="Data">Data</a-select-option>
          <a-select-option value="log">log</a-select-option>
          <a-select-option v-for="ate_logs in ate_logs_names" :value="formatLogs(ate_logs)" :key="formatLogs(ate_logs)">{{ formatLogs(ate_logs) }}</a-select-option>
        </a-select>
      </a-form-item>
      <input type="hidden" name="project" :value="formState.project" />
      <input type="hidden" name="station" :value="formState.station" />
      <input type="hidden" name="test" :value="formState.test" />
    </a-form>
  </a-row>
  <a-row style="margin-bottom: 10px">
    <a-col :span="6">
      <a-space align="center">
        <a-dropdown>
          <template #overlay>
            <a-menu>
              <a-menu-item key="download" @click="download"
                >Download Selected</a-menu-item
              >
            </a-menu>
          </template>
          <a-button v-if="hasSelected" :disabled="!hasSelected">
            Actions
            <DownOutlined />
          </a-button>
        </a-dropdown>
        <span style="margin-left: 8px">
          <template v-if="hasSelected">
            {{ `Selected ${selectedRowKeys.length} items` }}
          </template>
        </span>
      </a-space>
    </a-col>
  </a-row>
  <a-spin tip="Loading..." :spinning="spinning">
    <a-table
      :row-selection="{
        selectedRowKeys: selectedRowKeys,
        onChange: onSelectChange,
      }"
      :columns="columns"
      :data-source="data"
      :rowKey="(data) => data._id"
      :pagination="{
        pageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '30', '40', '50'],
      }"
    >
      <template
        #filterDropdownDateRange="{
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
          column,
        }"
      >
        <div style="padding: 8px">
          <a-range-picker
            allowClear="true"
            v-model:value="dateRange"
            style="width: 250px; margin-bottom: 8px; display: block"
            @change="(e) => setSelectedKeys(dateRange ? [dateRange] : [])"
            @pressEnter="
              handleSearchDateRange(selectedKeys, confirm, column.dataIndex)
            "
          />
          <a-button
            type="primary"
            size="small"
            style="width: 90px; margin-right: 8px"
            @click="
              handleSearchDateRange(selectedKeys, confirm, column.dataIndex)
            "
          >
            <template #icon><SearchOutlined /></template>
            Search
          </a-button>
          <a-button
            size="small"
            style="width: 90px"
            @click="handleResetDateRange(clearFilters)"
          >
            Reset
          </a-button>
        </div>
      </template>
      <template
        #filterDropdown="{
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
          column,
        }"
      >
        <div style="padding: 8px">
          <a-input
            ref="searchInput"
            :placeholder="`Search ${column.dataIndex}`"
            :value="selectedKeys[0]"
            style="width: 188px; margin-bottom: 8px; display: block"
            @change="
              (e) => setSelectedKeys(e.target.value ? [e.target.value] : [])
            "
            @pressEnter="handleSearch(selectedKeys, confirm, column.dataIndex)"
          />
          <a-button
            type="primary"
            size="small"
            style="width: 90px; margin-right: 8px"
            @click="handleSearch(selectedKeys, confirm, column.dataIndex)"
          >
            <template #icon><SearchOutlined /></template>
            Search
          </a-button>
          <a-button
            size="small"
            style="width: 90px"
            @click="handleReset(clearFilters)"
          >
            Reset
          </a-button>
        </div>
      </template>
      <template #filterIcon="filtered">
        <search-outlined :style="{ color: filtered ? '#108ee9' : undefined }" />
      </template>
      <template #customRender="{ text, column }">
        <span v-if="searchText && searchedColumn === column.dataIndex">
          <template
            v-for="(fragment, i) in text
              .toString()
              .split(new RegExp(`(?<=${searchText})|(?=${searchText})`, 'i'))"
          >
            <mark
              v-if="fragment.toLowerCase() === searchText.toLowerCase()"
              class="highlight"
              :key="i"
            >
              {{ fragment }}
            </mark>
            <template v-else>{{ fragment }}</template>
          </template>
        </span>
        <template v-else-if="column.dataIndex == 'filepath'">
          <span v-if="text">
            <a-button type="link" @click="downloadSingle(text)">
              <DownloadOutlined twoToneColor="#f39c12" />
            </a-button>
          </span>
        </template>
        <template v-else-if="column.dataIndex == 'added_time'">
          {{ testDateFormatted(text) }}
        </template>
        <template v-else>
          {{ text }}
        </template>
      </template>
    </a-table>
  </a-spin>
</template>

<script>
import { Dashboard } from "@uppy/vue";
import Uppy from "@uppy/core";
import XHRUpload from "@uppy/xhr-upload";

import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

import { SearchOutlined, DownloadOutlined } from "@ant-design/icons-vue";
import { notification } from "ant-design-vue";
import axios from "axios";
import moment from "moment";
import b64ToBlob from "b64-to-blob";

export default {
  name: "App",
  components: {
    Dashboard,
    SearchOutlined,
    DownloadOutlined,
  },
  data() {
    return {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 },
      formRef: {},
      formState: {
        project: null,
        station: null,
        test: null,
      },
      projectStations: [],
      searchText: "",
      searchColumn: "",
      selectedRowKeys: [],
      data: null,
      onComplete: false,
      loading: false,
      ate_logs_names: [],
      columns: [
        {
          title: "Result",
          dataIndex: "result",
          key: "result",
          width: 100,
          fixed: "left",
          slots: {
            filterDropdown: "filterDropdown",
            filterIcon: "filterIcon",
            customRender: "customRender",
          },
          onFilter: (value, record) =>
            record.result
              .toString()
              .toLowerCase()
              .includes(value.toLowerCase()),
        },
        {
          width: 120,
          title: "Test Date",
          dataIndex: "test_date",
          key: "test_date",
          fixed: "left",
          slots: {
            filterDropdown: "filterDropdownDateRange",
            filterIcon: "filterIcon",
            customRender: "customRender",
          },
          onFilter: (value, record) => {
            if (
              this.dateRange[0] != undefined &&
              this.dateRange[1] != undefined
            ) {
              let date1 = new Date(this.dateRange[0]).setHours(0, 0, 0, 0);
              let date2 = new Date(this.dateRange[1]).setHours(23, 59, 59, 0);
              if (date1 == date2) {
                return (
                  new Date(record.test_date) >= date1 &&
                  new Date(record.test_date) <=
                    new Date(date1).setDate(new Date(date1).getDate() + 1)
                );
              } else {
                return (
                  new Date(record.test_date) >= date1 &&
                  new Date(record.test_date) <= date2
                );
              }
            } else return record;
          },
        },
        {
          title: "Test Part",
          dataIndex: "test_station",
          key: "test_station",
          width: 150,
          fixed: "left",
          slots: {
            filterDropdown: "filterDropdown",
            filterIcon: "filterIcon",
            customRender: "customRender",
          },
          onFilter: (value, record) =>
            record.test_station
              .toString()
              .toLowerCase()
              .includes(value.toLowerCase()),
          onFilterDropdownVisibleChange: (visible) => {
            if (visible) {
              console.log(visible);
            }
          },
        },
        {
          title: "Serial Number",
          width: 150,
          dataIndex: "serial_number",
          key: "serial_number",
          fixed: "left",
          slots: {
            filterDropdown: "filterDropdown",
            filterIcon: "filterIcon",
            customRender: "customRender",
          },
          onFilter: (value, record) =>
            record.serial_number
              .toString()
              .toLowerCase()
              .includes(value.toLowerCase()),
          onFilterDropdownVisibleChange: (visible) => {
            if (visible) {
              console.log(visible);
            }
          },
        },
        {
          title: "Mac Address",
          dataIndex: "mac_address",
          key: "mac_address",
          width: 150,
          fixed: "left",
          slots: {
            filterDropdown: "filterDropdown",
            filterIcon: "filterIcon",
            customRender: "customRender",
          },
          onFilter: (value, record) =>
            record.mac_address
              .toString()
              .toLowerCase()
              .includes(value.toLowerCase()),
          onFilterDropdownVisibleChange: (visible) => {
            if (visible) {
              console.log(visible);
            }
          },
        },
        {
          title: "Error Code",
          dataIndex: "error_code",
          key: "error_code",
          width: 100,
          slots: {
            filterDropdown: "filterDropdown",
            filterIcon: "filterIcon",
            customRender: "customRender",
          },
          onFilter: (value, record) =>
            record.error_code
              .toString()
              .toLowerCase()
              .includes(value.toLowerCase()),
          onFilterDropdownVisibleChange: (visible) => {
            if (visible) {
              console.log(visible);
            }
          },
        },
        {
          title: "Test Time (minutes)",
          dataIndex: "test_time_minutes",
          key: "test_time_minutes",
          width: 100,
          slots: {
            customRender: "customRender",
          },
        },
        {
          title: "Data(.txt)",
          dataIndex: "data_txt_filename",
          key: "data_txt_filename",
          width: 150,
          slots: { customRender: "customRender" },
        },
        {
          title: "Log(.txt)",
          dataIndex: "log_txt_filename",
          key: "log_txt_filename",
          width: 150,
          slots: { customRender: "customRender" },
        },
        {
          title: "Comport(.txt)",
          dataIndex: "comport_txt_filename",
          key: "comport_txt_filename",
          width: 150,
          slots: { customRender: "customRender" },
        },
        {
          title: "Telnet(.txt)",
          dataIndex: "telnet_txt_filename",
          key: "telnet_txt_filename",
          width: 150,
          slots: { customRender: "customRender" },
        },
        {
          title: "Added Time",
          dataIndex: "added_time",
          key: "added_time",
          width: 120,
          slots: { customRender: "customRender" },
        },
      ],
      rules: {
        project: [
          {
            type: "string",
            validator: this.checkProjectName,
            required: true,
            trigger: ["change", "blur"],
          },
        ],
        station: [
          {
            type: "string",
            validator: this.checkProjectStation,
            required: true,
            trigger: "blur",
          },
        ],
        test: [
          {
            type: "string",
            validator: this.checkProjectFile,
            required: true,
            trigger: "blur",
          },
        ],
      },
      spinning: false,
      getUsername: null,
      projects: null,
    };
  },
  mounted() {
    this.fetchProjects();
    this.getLogs();

    this.uppy.on("upload", async () => {
      this.uppy.setMeta({
        project: this.formState.project,
        station: this.formState.station,
        test: this.formState.test,
      });
    });

    this.uppy.on("complete", (result) => {
      let fileFailedString = result.failed.length > 1 ? "files are" : "file is";
      let fileSuccessString =
        result.successful.length > 1 ? "files are" : "file is";

      console.log(result.failed);
      if (result.failed.length) {
        let errorMessage = result.failed[0].response.body.error;

        if (errorMessage && result.failed[0].response.status === 400) {
          this.openNotificationWithIcon("error", "Error", `${errorMessage}`);
        } else {
          this.openNotificationWithIcon(
            "error",
            "Error",
            `${result.failed.length} ${fileFailedString} not uploded. Check the files!`
          );
          console.error("Errors:");
          result.failed.forEach((file) => {
            console.error(file.error);
          });
        }
      } else {
        this.openNotificationWithIcon(
          "success",
          "Success",
          `${result.successful.length} ${fileSuccessString} successfuly uploded !`
        );

        this.formState.project = null;
        this.formState.station = null;
        this.formState.test = null;
      }
    });
  },
  computed: {
    hasSelected() {
      return this.selectedRowKeys.length > 0;
    },
    uppy: () => {
      const token = localStorage.getItem("user");
      return new Uppy({
        restrictions: {
          maxFileSize: 1000000000, // 1000mb = 1GB
        },
        meta: {
          user: localStorage.getItem("user"),
        },
      }).use(XHRUpload, {
        endpoint: "/api/file/converter/upload",
        fieldName: "files",
        formData: true,
        headers: {
          Authorization: `Token ${token}`,
        },
      });
    },
  },
  beforeUnmount() {
    this.uppy.close();
  },
  methods: {
     formatLogs(ateLogs){
      let logsName = ateLogs.split("_")[0]
      let firstChar = logsName.substring(0, 1).toUpperCase() // C
      let restChar = logsName.substring(1, logsName.length) // omport
      let newName = firstChar + restChar + "Text" // ComportText 
      
      return newName
    },
    async fetchProjects() {
      await axios.get("/api/project/all").then((res) => {
        this.projects = res.data.projects[0];
        this.selectedProjectId = res.data.projects[0][0]._id;
      });
    },
    async getStations(value) {
      await axios.get(`/api/project/search/${value}`).then((res) => {
        this.projectStations = res.data.project.stations;
      });
    },
    async getLogs() {
      this.ate_logs_names = await axios
        .get(`/api/logs/all`)
        .then(async (res) => {
          return res.data.logs.txt_filenames;
        });
    },
    filterOption(input, option) {
      return option.props.value.toLowerCase().indexOf(input.toLowerCase()) >= 0;
    },
    async checkProjectName() {
      const project = this.formState.project;
      if (!project) {
        return Promise.reject("Please input the project name");
      }
    },
    async checkProjectStation() {
      const station = this.formState.station;
      if (!station) {
        return Promise.reject("Please input the station");
      }
    },
    async checkProjectFile() {
      const file = this.formState.test;
      if (!file) {
        return Promise.reject("Please input the file");
      }
    },
    openNotificationWithIcon(type, message, description) {
      notification[type]({
        message: message,
        description: description,
      });
    },
    async downloadSingle(filepath) {
      // modalDownloadLink = storage/2021_07_19/WIN_20210703_20_01_31_Pro.jpg
      let convertLink = filepath.replace("/", "-").replace("/", "-");
      // convertLink = storage-2021_07_19-WIN_20210703_20_01_31_Pro.jpg

      let convertLinkSplit = convertLink.split("-");
      let fileName = convertLinkSplit[convertLinkSplit.length - 1];

      await axios({
        method: "get",
        url: "/api/file/download/" + convertLink,
        responseType: "blob",
      })
        .then((res) => {
          let fileUrl = window.URL.createObjectURL(new Blob([res.data]));
          let fileLink = document.createElement("a");
          fileLink.href = fileUrl;
          fileLink.setAttribute("download", fileName);
          document.body.appendChild(fileLink);
          fileLink.click();
        })
        .catch((err) => {
          console.log("error: ", err);
        });
    },
    async download() {
      await axios({
        method: "post",
        url: `/api/file/universal/download`,
        data: {
          files: this.selectedRowKeys,
        },
      })
        .then((res) => {
          const zipAsBase64 = res.data.zip64;
          const blob = b64ToBlob(zipAsBase64, "application/zip");
          let fileUrl = window.URL.createObjectURL(new Blob([blob]));
          let fileLink = document.createElement("a");
          fileLink.href = fileUrl;
          fileLink.setAttribute("download", "bundle_download.zip");
          document.body.appendChild(fileLink);
          fileLink.click();
        })
        .catch((err) => {
          console.log("error: ", err);
        });
    },
    handleSearch(selectedKeys, confirm, dataIndex) {
      confirm();
      this.searchText = selectedKeys[0];
      this.searchedColumn = dataIndex;
    },
    handleSearchDateRange(selectedKeys, confirm, dataIndex) {
      confirm();
      this.searchedColumn = dataIndex;
    },
    handleReset(clearFilters) {
      clearFilters();
      this.searchText = "";
    },
    handleResetDateRange(clearFilters) {
      clearFilters();
      this.dateRange = "";
    },
    testDateFormatted(test_date) {
      return moment(test_date).format("YYYY/MM/DD HH:mm:ss");
    },
    onSelectChange(selectedRowKeys) {
      this.selectedRowKeys = selectedRowKeys;
    },
    async getAllAddedTestFiles() {
      this.spinning = true;
      await axios.get("/api/tests/added/all").then((res) => {
        this.data = res.data.tests;
        this.spinning = false;
      });
    },
  },
};
</script>