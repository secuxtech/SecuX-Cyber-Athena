import React from "react";

type ViewButtonProps = {
  formattedDetails: string;
  title: string;
};

export default function ViewButton({ formattedDetails, title }: ViewButtonProps) {
  return (
    <a
      tabIndex={0}
      className="btn btn-sm btn-outline-secondary"
      data-bs-custom-class="custom-popover"
      role="button"
      data-bs-toggle="popover"
      data-bs-trigger="focus"
      data-bs-placement="left"
      data-bs-title={title}
      data-bs-content={formattedDetails}
      data-bs-html="true"
    >
      View
    </a>
  );
}
