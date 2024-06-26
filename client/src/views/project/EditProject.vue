<template>
  <a-form
    ref="formRef"
    :model="formState"
    :rules="rules"
    :label-col="labelCol"
    :wrapper-col="wrapperCol"
    @finish="onSubmit"
  >
    <a-form-item label="Project Name" name="name">
      <a-input
        v-model:value="formState.name"
        placeholder="Example: MS1830_S2S"
      />
    </a-form-item>
    <a-form-item label="Project Stage" name="stage">
      <a-input
        v-model:value="formState.stage"
        placeholder="Example: If new project, please type 'EVT'"
      />
    </a-form-item>
    <a-form-item label="Project Status" name="status">
      <a-select v-model:value="formState.status">
        <a-select-option value="testing">Testing</a-select-option>
        <a-select-option value="finished">Finished</a-select-option>
      </a-select>
    </a-form-item>
    <a-form-item label="Project Description" name="description">
      <a-input v-model:value="formState.description" type="textarea" />
    </a-form-item>

    <!-- New Communication Interface Form field -->
    <a-form-item label="Communication Interface">
      <a-checkbox-group v-model:value="formState.communications" :options="communicationArrayObj"/>
    </a-form-item>

    <a-form-item
      required
      v-for="(newCommunication, index) in formState.newCommunications"
      :key="newCommunication.key"
      v-bind="index === 0 ? formItemLayout : formItemLayoutWithOutLabel"
      :label="index === 0 ? 'New Interface' : ''"
      :name="['newCommunications', index, 'value']"
    >
      <a-input
        v-model:value="newCommunication.value"
        placeholder="please input new interface"
        style="width: 58%"
      />
      <MinusCircleOutlined
        v-if="formState.newCommunications.length > 1"
        class="dynamic-delete-button"
        :disabled="formState.newCommunications.length === 1"
        @click="removeNewCommunication(newCommunication)"
      />
    </a-form-item>
    <a-form-item v-bind="formItemLayoutWithOutLabel">
      <a-button type="dashed" style="width: 58%" @click="addNewCommunication">
        <PlusOutlined />
        Add New Communication Interface
      </a-button>
    </a-form-item>
    <a-form-item v-bind="formItemLayoutWithOutLabel">
      <a-button @click="resetNewCommunicationForm"
        >Reset New Communication Field</a-button
      >
    </a-form-item>

    <!-- Station Form field -->
    <a-form-item
      required
      v-for="(station, index) in formState.stations"
      :key="station.key"
      v-bind="index === 0 ? formItemLayout : formItemLayoutWithOutLabel"
      :label="index === 0 ? 'Stations' : ''"
      :name="['stations', index, 'value']"
    >
      <a-input
        v-model:value="station.value"
        placeholder="please input station"
        style="width: 58%"
      />
      <MinusCircleOutlined
        v-if="formState.stations.length > 1"
        class="dynamic-delete-button"
        :disabled="formState.stations.length === 1"
        @click="removeStation(station)"
      />
    </a-form-item>
    <a-form-item v-bind="formItemLayoutWithOutLabel">
      <a-button type="dashed" style="width: 58%" @click="addStation">
        <PlusOutlined />
        Add stations
      </a-button>
    </a-form-item>
    <a-form-item v-bind="formItemLayoutWithOutLabel">
      <a-button @click="resetStationForm">Reset Station Field</a-button>
    </a-form-item>

    <a-form-item :wrapper-col="{ span: 14, offset: 14 }">
      <a-button type="primary" html-type="submit">Edit Project</a-button>
    </a-form-item>
  </a-form>
</template>

<script>
import axios from "axios";
import { notification } from "ant-design-vue";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons-vue";

export default {
  components: {
    MinusCircleOutlined,
    PlusOutlined,
  },
  data() {
    return {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 },
      formRef: {},
      communicationArrayObj: [],
      checked: true,
      formState: {
        name: null,
        stage: "EVT",
        status: "Testing",
        description: null,
        communications: [],
        newCommunications: [],
        stations: [],
      },
      tempNewProjectName: null,
      project_ate_logs: [],
      formItemLayout: {
        labelCol: {
          xs: {
            span: 24,
          },
          sm: {
            span: 4,
          },
        },
        wrapperCol: {
          xs: {
            span: 24,
          },
          sm: {
            span: 20,
          },
        },
      },
      formItemLayoutWithOutLabel: {
        wrapperCol: {
          xs: {
            span: 24,
            offset: 0,
          },
          sm: {
            span: 20,
            offset: 4,
          },
          md: {
            span: 24,
            offset: 4,
          },
        },
      },
      rules: {
        name: [
          {
            type: "string",
            validator: this.checkProjectName,
            required: true,
            trigger: ["change", "blur"],
          },
        ],
        stage: [
          {
            type: "string",
            validator: this.checkProjectStage,
            required: true,
            message: "Please input project stage",
            trigger: "blur",
          },
        ],
      },
    };
  },
  mounted() {
    this.getProjectData(this.$route.params.id);
  },
  methods: {
    addNewCommunication() {
      this.formState.newCommunications.push({
        value: "",
        key: Date.now(),
      });
    },
    addStation() {
      this.formState.stations.push({
        value: "",
        key: Date.now(),
      });
    },
    removeNewCommunication(item) {
      let index = this.formState.new`Communications`.indexOf(item);
      if (index !== -1) {
        this.formState.newCommunications.splice(index, 1);
      }
    },
    removeStation(item) {
      let index = this.formState.stations.indexOf(item);
      if (index !== -1) {
        this.formState.stations.splice(index, 1);
      }
    },
    openNotificationWithIcon(type, message, description) {
      notification[type]({
        message: message,
        description: description,
      });
    },
    async checkProjectName() {
      if (!this.formState.name) {
        return Promise.reject("Please input the project name");
      } else if (this.formState.name !== this.tempNewProjectName) {
        await axios
          .get(`/api/project/search/${this.formState.name}`)
          .then((res) => {
            if (res.data.error) return Promise.reject(`${res.data.error}`);
          });
      }
    },
    async checkProjectStage() {
      const stage = this.formState.stage;
      if (!stage) {
        return Promise.reject("Please input the project stage");
      }
    },
    async getProjectData(id) {
      await axios.get(`/api/project/${id}`).then((res) => {
        this.formState.name = res.data.projects.name;
        this.formState.stage = res.data.projects.stage;
        this.formState.status = res.data.projects.status;
        this.formState.description = res.data.projects.description;
        this.formState.stations = res.data.projects.stations;

        this.tempNewProjectName = res.data.projects.name;
        this.project_ate_logs = res.data.projects.ate_logs;
      });

      let ate_logs = await axios.get("/api/logs/all").then((res) => {
        if (res.data.error) return Promise.reject(`${res.data.error}`);
        return res.data.logs.txt_filenames;
      });

      for (let i = 0; i < ate_logs.length; i++) {
        if (this.project_ate_logs[i]) {
          this.communicationArrayObj.push({
            label: ate_logs[i],
            value: ate_logs[i],
          });
          this.formState.communications.push(ate_logs[i])
        }  
        else {
          this.communicationArrayObj.push({
            label: ate_logs[i],
            value: ate_logs[i],
          });
        }
      }
    },
    async onSubmit() {
      const token = localStorage.getItem("user");
      console.log("formState", this.formState);

      console.log(this.formState.newCommunications);
      await axios({
        method: "post",
        url: "/api/project/edit",
        headers: {
          Authorization: `Token ${token}`,
        },
        data: {
          id: this.$route.params.id,
          name: this.formState.name,
          status: this.formState.status,
          stage: this.formState.stage,
          description: this.formState.description,
          communications: this.formState.communications,
          newCommunications: this.formState.newCommunications,
          stations: this.formState.stations,
        },
      })
        .then((res) => {
          if (res.data.message) {
            this.openNotificationWithIcon(
              "success",
              "Successful",
              `Project ${this.formState.name} has been edited !`
            );
            this.$router.push({ name: "project-list" });
          }
        })
        .catch((err) => {
          console.log("Error: ", err);
        });
    },
    resetNewCommunicationForm() {
      this.formState.newCommunications = [];
    },
    resetStationForm() {
      this.formState.stations = [];
    },
  },
};
</script>

<style>
</style>